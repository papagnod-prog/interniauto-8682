import { createHmac } from "node:crypto";
import { safeEqual } from "./crypto";

/** Chiamata diretta all'API Stripe (form-encoded), senza SDK. */
export async function stripeRequest<T>(
  secretKey: string,
  method: "GET" | "POST",
  path: string,
  params?: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Stripe-Version": "2024-06-20",
  };
  if (method === "POST") headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const url = `https://api.stripe.com/v1${path}${method === "GET" && params ? `?${params}` : ""}`;
  const res = await fetch(url, method === "POST" ? { method, headers, body: params } : { method, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new StripeError(data.error?.message ?? `Stripe HTTP ${res.status}`, res.status);
  }
  return data;
}

export class StripeError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  payment_status: "paid" | "unpaid" | "no_payment_required";
  amount_total: number | null;
  currency: string | null;
  livemode: boolean;
  payment_intent: string | null;
  client_reference_id: string | null;
  metadata: Record<string, string>;
};

export type CheckoutLine = { name: string; unitCents: number; qty: number; image?: string };

export async function createCheckoutSession(
  secretKey: string,
  p: {
    orderId: string;
    orderCode: string;
    email: string;
    lines: CheckoutLine[];
    shippingCents: number;
    shippingLabel: string;
    successUrl: string;
    cancelUrl: string;
    expiresAt: Date;
  },
) {
  const b = new URLSearchParams();
  b.set("mode", "payment");
  b.set("locale", "it");
  b.set("currency", "eur");
  b.set("success_url", p.successUrl);
  b.set("cancel_url", p.cancelUrl);
  b.set("client_reference_id", p.orderId);
  b.set("customer_email", p.email);
  b.set("expires_at", String(Math.floor(p.expiresAt.getTime() / 1000)));
  b.set("metadata[order_id]", p.orderId);
  b.set("metadata[order_code]", p.orderCode);
  b.set("payment_intent_data[metadata][order_id]", p.orderId);
  b.set("payment_intent_data[metadata][order_code]", p.orderCode);
  b.set("payment_intent_data[description]", `Ordine ${p.orderCode}`);
  p.lines.forEach((l, i) => {
    b.set(`line_items[${i}][quantity]`, String(l.qty));
    b.set(`line_items[${i}][price_data][currency]`, "eur");
    b.set(`line_items[${i}][price_data][unit_amount]`, String(l.unitCents));
    b.set(`line_items[${i}][price_data][product_data][name]`, l.name.slice(0, 250));
    if (l.image?.startsWith("https://")) {
      b.set(`line_items[${i}][price_data][product_data][images][0]`, l.image);
    }
  });
  b.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  b.set("shipping_options[0][shipping_rate_data][display_name]", p.shippingLabel.slice(0, 100));
  b.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(p.shippingCents));
  b.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", "eur");
  return stripeRequest<StripeCheckoutSession>(secretKey, "POST", "/checkout/sessions", b, `checkout-${p.orderId}`);
}

export const retrieveCheckoutSession = (secretKey: string, id: string) =>
  stripeRequest<StripeCheckoutSession>(secretKey, "GET", `/checkout/sessions/${encodeURIComponent(id)}`);

export const expireCheckoutSession = (secretKey: string, id: string) =>
  stripeRequest<StripeCheckoutSession>(
    secretKey,
    "POST",
    `/checkout/sessions/${encodeURIComponent(id)}/expire`,
  );

/** Verifica la chiave: restituisce il nome dell'account Stripe. */
export async function verifyStripeKey(secretKey: string) {
  const acc = await stripeRequest<{
    id: string;
    settings?: { dashboard?: { display_name?: string } };
    business_profile?: { name?: string };
  }>(secretKey, "GET", "/account");
  return acc.settings?.dashboard?.display_name || acc.business_profile?.name || acc.id;
}

/**
 * Verifica l'header Stripe-Signature (HMAC-SHA256 di "t.payload"), tolleranza 5 minuti.
 * https://docs.stripe.com/webhooks#verify-manually
 */
export function verifyStripeSignature(payload: string, header: string | undefined, secret: string) {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim().split("=") as [string, string]);
  const t = parts.find(([k]) => k === "t")?.[1];
  const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !/^\d+$/.test(t) || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`, "utf8").digest("hex");
  return signatures.some((s) => safeEqual(s, expected));
}
