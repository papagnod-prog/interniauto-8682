import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { settings } from "../database/schema";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";

async function read(key: string): Promise<unknown> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  if (!row) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

async function write(key: string, value: unknown) {
  const json = JSON.stringify(value);
  await db
    .insert(settings)
    .values({ key, value: json, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value: json, updatedAt: new Date() } });
}

// ───────────── Spedizione (solo Italia) ─────────────

export const shippingSchema = z.object({
  /** Tariffa unica nazionale in centesimi. */
  flatRateCents: z.number().int().min(0).max(100_000),
  /** Spedizione gratuita sopra questa soglia (null = mai). */
  freeOverCents: z.number().int().min(1).max(10_000_000).nullable(),
  carrier: z.string().trim().max(80),
  /** Tempi indicativi, es. "2–4 giorni lavorativi". */
  deliveryTime: z.string().trim().min(2).max(80),
  note: z.string().trim().max(400),
});
export type ShippingConfig = z.infer<typeof shippingSchema>;

/** null = spedizione non ancora configurata: il checkout resta bloccato. */
export async function getShipping(): Promise<ShippingConfig | null> {
  const parsed = shippingSchema.safeParse(await read("shipping"));
  return parsed.success ? parsed.data : null;
}

export const saveShipping = (cfg: ShippingConfig) => write("shipping", cfg);

export function shippingFor(cfg: ShippingConfig, subtotalCents: number) {
  if (cfg.freeOverCents !== null && subtotalCents >= cfg.freeOverCents) return 0;
  return cfg.flatRateCents;
}

// ───────────── Stripe (segreti cifrati) ─────────────

type StoredStripe = {
  testSecretKey?: string;
  testWebhookSecret?: string;
  accountName?: string;
  verifiedAt?: string;
};

async function readStripe(): Promise<StoredStripe> {
  const v = await read("stripe");
  return v && typeof v === "object" ? (v as StoredStripe) : {};
}

function open(value?: string) {
  if (!value) return null;
  try {
    return decryptSecret(value);
  } catch {
    return null;
  }
}

/** Solo lato server. Il valore non va mai restituito al browser. */
export async function getStripeSecrets() {
  const s = await readStripe();
  return {
    testSecretKey: open(s.testSecretKey) ?? process.env.STRIPE_TEST_SECRET_KEY ?? null,
    testWebhookSecret: open(s.testWebhookSecret) ?? process.env.STRIPE_TEST_WEBHOOK_SECRET ?? null,
  };
}

export async function getStripePublicStatus() {
  const s = await readStripe();
  const secrets = await getStripeSecrets();
  return {
    mode: "test" as const,
    liveAvailable: false,
    testSecretKey: secrets.testSecretKey ? maskSecret(secrets.testSecretKey) : null,
    testWebhookSecret: secrets.testWebhookSecret ? maskSecret(secrets.testWebhookSecret) : null,
    source: s.testSecretKey ? ("dashboard" as const) : secrets.testSecretKey ? ("env" as const) : null,
    accountName: s.accountName ?? null,
    verifiedAt: s.verifiedAt ?? null,
  };
}

export async function saveStripeSecrets(input: {
  testSecretKey?: string;
  testWebhookSecret?: string;
  accountName?: string;
}) {
  const current = await readStripe();
  const next: StoredStripe = { ...current };
  if (input.testSecretKey) {
    next.testSecretKey = encryptSecret(input.testSecretKey);
    next.accountName = input.accountName;
    next.verifiedAt = new Date().toISOString();
  }
  if (input.testWebhookSecret) next.testWebhookSecret = encryptSecret(input.testWebhookSecret);
  await write("stripe", next);
}

export async function clearStripeSecrets() {
  await write("stripe", {});
}
