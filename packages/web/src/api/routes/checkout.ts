import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import { shopOrders } from "../database/schema";
import { withUser } from "../middleware/auth";
import { siteUrl } from "../lib/business";
import { orderCode, randomToken, sha256 } from "../lib/crypto";
import { getStripeSecrets } from "../lib/settings";
import {
  MAX_QTY_PER_LINE,
  parseItems,
  quote,
  reconcileOrder,
  releaseOrder,
  RESERVATION_MINUTES,
  reserveStock,
  sweepExpired,
} from "../lib/shop";
import { createCheckoutSession, expireCheckoutSession } from "../lib/stripe";
import { SALES_OPEN } from "./shop";

const cartInput = z
  .array(
    z.object({
      productId: z.number().int().positive(),
      qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
    }),
  )
  .min(1)
  .max(30);

/** Province italiane (sigle). */
const PROVINCES = new Set(
  "AG AL AN AO AP AQ AR AT AV BA BG BI BL BN BO BR BS BT BZ CA CB CE CH CL CN CO CR CS CT CZ EN FC FE FG FI FM FR GE GO GR IM IS KR LC LE LI LO LT LU MB MC ME MI MN MO MS MT NA NO NU OR PA PC PD PE PG PI PN PO PR PT PU PV PZ RA RC RE RG RI RM RN RO SA SI SO SP SR SS SU SV TA TE TN TO TP TR TS TV UD VA VB VC VE VI VR VT VV".split(
    " ",
  ),
);

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

export const shippingAddress = z
  .object({
    name: text(3, 120),
    email: z.string().trim().toLowerCase().email().max(200),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ./-]{6,20}$/, "Telefono non valido"),
    addressLine1: text(4, 160),
    addressLine2: z.string().trim().max(160).default(""),
    postalCode: z.string().trim().regex(/^\d{5}$/, "CAP non valido"),
    city: text(2, 80),
    province: z
      .string()
      .trim()
      .toUpperCase()
      .refine((v) => PROVINCES.has(v), "Provincia non valida"),
    country: z.literal("IT", { message: "Spediamo solo in Italia" }),
    note: z.string().trim().max(500).default(""),
  })
  .refine(
    // San Marino (4789x) e Città del Vaticano (00120) non sono territorio italiano.
    (a) => !/^4789\d$/.test(a.postalCode) && a.postalCode !== "00120",
    { message: "Spediamo solo in Italia (San Marino e Vaticano esclusi)", path: ["postalCode"] },
  );

export const checkout = {
  /** Carrello ricalcolato dal server. */
  quote: base
    .input(z.object({ items: z.array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(MAX_QTY_PER_LINE) })).max(30) }))
    .handler(async ({ input }) => {
      const q = await quote(input.items);
      return {
        lines: q.lines,
        missing: q.missing,
        subtotalCents: q.subtotalCents,
        shippingCents: q.shippingCents,
        totalCents: q.totalCents,
        shippingConfigured: !!q.shipping,
        deliveryTime: q.shipping?.deliveryTime ?? null,
        ok: q.ok,
      };
    }),

  /**
   * Crea ordine + sessione Stripe Checkout. Fase 2: solo modalità TEST e solo con
   * sessione amministratore; i visitatori ricevono un errore finché la vendita è chiusa.
   */
  create: withUser
    .input(z.object({ items: cartInput, address: shippingAddress }))
    .handler(async ({ input, context }) => {
      if (!SALES_OPEN && !context.isAdmin) {
        throw new ORPCError("FORBIDDEN", { message: "Le vendite online non sono ancora attive." });
      }
      const mode = "test" as const;
      const { testSecretKey } = await getStripeSecrets();
      if (!testSecretKey) {
        throw new ORPCError("PRECONDITION_FAILED", { message: "Stripe (test) non è configurato." });
      }
      await sweepExpired();
      const q = await quote(input.items);
      if (!q.shipping || q.shippingCents === null || q.totalCents === null) {
        throw new ORPCError("PRECONDITION_FAILED", { message: "Spedizione non configurata." });
      }
      if (q.missing.length) {
        throw new ORPCError("BAD_REQUEST", { message: "Uno o più prodotti non sono disponibili." });
      }
      const problem = q.lines.find((l) => l.problem);
      if (problem) {
        throw new ORPCError("CONFLICT", {
          message: `Disponibilità insufficiente per "${problem.name}".`,
        });
      }

      const reserved = await reserveStock(q.lines);
      if (!reserved.ok) {
        throw new ORPCError("CONFLICT", { message: "Disponibilità cambiata: aggiorna il carrello." });
      }

      const id = randomUUID();
      const token = randomToken();
      const code = orderCode();
      // Stripe richiede almeno 30 minuti: aggiungiamo un margine.
      const expiresAt = new Date(Date.now() + (RESERVATION_MINUTES + 1) * 60 * 1000);
      const a = input.address;
      const items = q.lines.map(({ productId, slug, name, unitCents, qty, image }) => ({
        productId,
        slug,
        name,
        unitCents,
        qty,
        image,
      }));
      await db.insert(shopOrders).values({
        id,
        code,
        accessTokenHash: sha256(token),
        mode,
        customerName: a.name,
        email: a.email,
        phone: a.phone,
        addressLine1: a.addressLine1,
        addressLine2: a.addressLine2,
        postalCode: a.postalCode,
        city: a.city,
        province: a.province,
        country: "IT",
        customerNote: a.note,
        items: JSON.stringify(items),
        subtotalCents: q.subtotalCents,
        shippingCents: q.shippingCents,
        totalCents: q.totalCents,
        reservationExpiresAt: expiresAt,
      });

      try {
        const origin = siteUrl();
        const session = await createCheckoutSession(testSecretKey, {
          orderId: id,
          orderCode: code,
          email: a.email,
          lines: items.map((i) => ({ ...i, image: i.image ?? undefined })),
          shippingCents: q.shippingCents,
          shippingLabel: q.shipping.carrier
            ? `Spedizione Italia · ${q.shipping.carrier}`
            : "Spedizione Italia",
          successUrl: `${origin}/ordine/${token}?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/ordine/${token}?annullato=1`,
          expiresAt,
        });
        if (!session.url) throw new Error("Sessione Stripe senza URL");
        await db
          .update(shopOrders)
          .set({ stripeSessionId: session.id, updatedAt: new Date() })
          .where(eq(shopOrders.id, id));
        return { url: session.url, code };
      } catch (err) {
        console.error("Creazione sessione Stripe fallita:", err);
        await releaseOrder(id, "canceled");
        throw new ORPCError("BAD_GATEWAY", {
          message: "Impossibile avviare il pagamento. Riprova tra poco.",
        });
      }
    }),

  /** Stato ordine per il cliente: accesso solo con il token segreto ricevuto al checkout. */
  order: base
    .input(z.object({ token: z.string().min(40).max(64), canceled: z.boolean().optional() }))
    .handler(async ({ input }) => {
      const hash = sha256(input.token);
      let [order] = await db.select().from(shopOrders).where(eq(shopOrders.accessTokenHash, hash));
      if (!order) throw new ORPCError("NOT_FOUND", { message: "Ordine non trovato" });

      if (order.status === "pending_payment") {
        if (input.canceled && order.stripeSessionId) {
          // Il cliente ha abbandonato il pagamento: chiudiamo la sessione e liberiamo lo stock.
          const { testSecretKey } = await getStripeSecrets();
          if (testSecretKey) {
            await reconcileOrder(order.id);
            [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, order.id));
            if (order?.status === "pending_payment" && order.stripeSessionId) {
              try {
                await expireCheckoutSession(testSecretKey, order.stripeSessionId);
                await releaseOrder(order.id, "canceled");
              } catch (err) {
                console.error("Annullamento sessione:", err);
              }
            }
          }
        } else {
          await reconcileOrder(order.id);
        }
        [order] = await db.select().from(shopOrders).where(eq(shopOrders.accessTokenHash, hash));
        if (!order) throw new ORPCError("NOT_FOUND", { message: "Ordine non trovato" });
      }

      return {
        code: order.code,
        mode: order.mode,
        status: order.status,
        items: parseItems(order.items),
        subtotalCents: order.subtotalCents,
        shippingCents: order.shippingCents,
        totalCents: order.totalCents,
        city: order.city,
        province: order.province,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        shippedAt: order.shippedAt,
        carrier: order.carrier,
        trackingNumber: order.trackingNumber,
      };
    }),
};
