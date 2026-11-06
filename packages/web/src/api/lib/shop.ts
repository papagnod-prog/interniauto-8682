import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { db } from "../database";
import { products, shopOrders } from "../database/schema";
import { getShipping, getStripeSecrets, shippingFor } from "./settings";
import {
  expireCheckoutSession,
  retrieveCheckoutSession,
  type StripeCheckoutSession,
} from "./stripe";

export const MAX_QTY_PER_LINE = 10;
export const RESERVATION_MINUTES = 30;

export type OrderItem = {
  productId: number;
  slug: string;
  name: string;
  unitCents: number;
  qty: number;
  image: string | null;
};

export function parseJsonArray(raw: string): unknown[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const parseImages = (raw: string) =>
  parseJsonArray(raw).filter((x): x is string => typeof x === "string");

export const parseItems = (raw: string) => parseJsonArray(raw) as OrderItem[];

/** Condizione unica di visibilità pubblica di un prodotto. */
export const isPublic = and(eq(products.status, "published"), eq(products.legacy, false));

export type QuoteLine = OrderItem & {
  available: number;
  problem: null | "unavailable" | "insufficient_stock";
};

/**
 * Ricalcola il carrello lato server: prezzo, disponibilità e spedizione arrivano
 * sempre dal database, mai dal browser.
 */
export async function quote(items: { productId: number; qty: number }[]) {
  const merged = new Map<number, number>();
  for (const i of items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.qty);
  const ids = [...merged.keys()];
  const rows = ids.length
    ? await db
        .select()
        .from(products)
        .where(and(inArray(products.id, ids), isPublic))
    : [];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const lines: QuoteLine[] = [];
  const missing: number[] = [];
  for (const [productId, qty] of merged) {
    const r = byId.get(productId);
    if (!r) {
      missing.push(productId);
      continue;
    }
    lines.push({
      productId,
      slug: r.slug,
      name: r.name,
      unitCents: r.priceCents,
      qty,
      image: parseImages(r.images)[0] ?? null,
      available: r.stock,
      problem: r.stock <= 0 ? "unavailable" : r.stock < qty ? "insufficient_stock" : null,
    });
  }
  const subtotalCents = lines.reduce((s, l) => s + l.unitCents * l.qty, 0);
  const shipping = await getShipping();
  const shippingCents = shipping && lines.length ? shippingFor(shipping, subtotalCents) : null;
  return {
    lines,
    missing,
    subtotalCents,
    shippingCents,
    totalCents: shippingCents === null ? null : subtotalCents + shippingCents,
    shipping,
    ok: lines.length > 0 && missing.length === 0 && lines.every((l) => !l.problem) && !!shipping,
  };
}

/** Prenota lo stock in modo atomico; in caso di errore annulla le prenotazioni già fatte. */
export async function reserveStock(lines: { productId: number; qty: number }[]) {
  const done: { productId: number; qty: number }[] = [];
  for (const l of lines) {
    const res = await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${l.qty}` })
      .where(and(eq(products.id, l.productId), gte(products.stock, l.qty), isPublic));
    if (res.rowsAffected !== 1) {
      await restock(done);
      return { ok: false as const, productId: l.productId };
    }
    done.push(l);
  }
  return { ok: true as const };
}

async function restock(lines: { productId: number; qty: number }[]) {
  for (const l of lines) {
    await db
      .update(products)
      .set({ stock: sql`${products.stock} + ${l.qty}` })
      .where(eq(products.id, l.productId));
  }
}

/** Rilascia lo stock una sola volta (transizione condizionale reserved → released). */
export async function releaseOrder(orderId: string, status: "expired" | "canceled") {
  const res = await db
    .update(shopOrders)
    .set({ stockState: "released", status, updatedAt: new Date() })
    .where(
      and(
        eq(shopOrders.id, orderId),
        eq(shopOrders.stockState, "reserved"),
        eq(shopOrders.status, "pending_payment"),
      ),
    );
  if (res.rowsAffected !== 1) return false;
  const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, orderId));
  if (order) await restock(parseItems(order.items));
  return true;
}

/**
 * Segna pagato solo se la sessione Stripe corrisponde esattamente all'ordine
 * (id, importo, valuta, stato pagamento). Idempotente.
 */
export async function applyPaidSession(session: StripeCheckoutSession) {
  const orderId = session.metadata?.order_id ?? session.client_reference_id;
  if (!orderId) return { ok: false as const, reason: "no_order" };
  const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, orderId));
  if (!order) return { ok: false as const, reason: "unknown_order" };
  if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
    return { ok: true as const, already: true };
  }
  const matches =
    session.payment_status === "paid" &&
    session.id === order.stripeSessionId &&
    session.amount_total === order.totalCents &&
    session.currency === "eur" &&
    session.livemode === (order.mode === "live");
  if (!matches) {
    await db
      .update(shopOrders)
      .set({
        status: "review",
        adminNote: `${order.adminNote}\n[Sistema] Pagamento Stripe non corrispondente: verificare ${session.id}`.trim(),
        updatedAt: new Date(),
      })
      .where(eq(shopOrders.id, order.id));
    return { ok: false as const, reason: "mismatch" };
  }
  if (order.stockState === "released") {
    // Pagamento arrivato dopo il rilascio: non dovrebbe accadere (sessione scaduta), richiede verifica.
    await db
      .update(shopOrders)
      .set({
        status: "review",
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent,
        adminNote: `${order.adminNote}\n[Sistema] Pagato dopo il rilascio della prenotazione: verificare lo stock.`.trim(),
        updatedAt: new Date(),
      })
      .where(eq(shopOrders.id, order.id));
    return { ok: false as const, reason: "released" };
  }
  await db
    .update(shopOrders)
    .set({
      status: "paid",
      stockState: "committed",
      paidAt: new Date(),
      stripePaymentIntentId: session.payment_intent,
      updatedAt: new Date(),
    })
    .where(and(eq(shopOrders.id, order.id), eq(shopOrders.status, "pending_payment")));
  return { ok: true as const, already: false };
}

/** Riallinea un ordine in attesa interrogando Stripe lato server. */
export async function reconcileOrder(orderId: string) {
  const [order] = await db.select().from(shopOrders).where(eq(shopOrders.id, orderId));
  if (!order || order.status !== "pending_payment" || !order.stripeSessionId) return;
  const { testSecretKey } = await getStripeSecrets();
  if (order.mode !== "test" || !testSecretKey) return;
  try {
    const session = await retrieveCheckoutSession(testSecretKey, order.stripeSessionId);
    if (session.payment_status === "paid") await applyPaidSession(session);
    else if (session.status === "expired") await releaseOrder(order.id, "expired");
  } catch (err) {
    console.error("Riallineamento Stripe fallito:", err);
  }
}

/** Libera le prenotazioni scadute (sessioni non pagate oltre i 30 minuti + margine). */
export async function sweepExpired() {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  const stale = await db
    .select({ id: shopOrders.id, sessionId: shopOrders.stripeSessionId, mode: shopOrders.mode })
    .from(shopOrders)
    .where(and(eq(shopOrders.status, "pending_payment"), lt(shopOrders.reservationExpiresAt, cutoff)))
    .limit(20);
  if (!stale.length) return;
  const { testSecretKey } = await getStripeSecrets();
  for (const o of stale) {
    if (o.sessionId && o.mode === "test" && testSecretKey) {
      try {
        const s = await retrieveCheckoutSession(testSecretKey, o.sessionId);
        if (s.payment_status === "paid") {
          await applyPaidSession(s);
          continue;
        }
        if (s.status === "open") await expireCheckoutSession(testSecretKey, o.sessionId);
      } catch (err) {
        console.error("Sweep Stripe:", err);
        continue; // non rilasciare se non possiamo verificare il pagamento
      }
    }
    await releaseOrder(o.id, "expired");
  }
}
