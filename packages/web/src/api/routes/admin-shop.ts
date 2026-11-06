import { and, desc, eq, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "../database";
import { products, shopOrders, stripeEvents } from "../database/schema";
import { adminOnly } from "../middleware/auth";
import { siteUrl } from "../lib/business";
import {
  clearStripeSecrets,
  getShipping,
  getStripePublicStatus,
  saveShipping,
  saveStripeSecrets,
  shippingSchema,
} from "../lib/settings";
import { parseItems, reconcileOrder, sweepExpired } from "../lib/shop";
import { StripeError, verifyStripeKey } from "../lib/stripe";
import { SALES_OPEN } from "./shop";

const ORDER_STATUSES = ["pending_payment", "paid", "shipped", "delivered", "expired", "canceled", "review"] as const;

/** Transizioni manuali consentite dalla dashboard. "paid" arriva solo da Stripe. */
const MANUAL: Record<string, readonly string[]> = {
  paid: ["shipped"],
  review: ["paid_confirmed", "canceled_review"],
  shipped: ["delivered", "paid"],
  delivered: ["shipped"],
};

export const adminShop = {
  me: adminOnly.handler(({ context }) => ({ email: context.user.email, name: context.user.name })),

  overview: adminOnly.handler(async () => {
    await sweepExpired();
    const [counts] = await db
      .select({
        published: sql<number>`sum(case when ${products.status} = 'published' and ${products.legacy} = 0 then 1 else 0 end)`,
        drafts: sql<number>`sum(case when ${products.status} = 'draft' and ${products.legacy} = 0 then 1 else 0 end)`,
        outOfStock: sql<number>`sum(case when ${products.status} = 'published' and ${products.legacy} = 0 and ${products.stock} <= 0 then 1 else 0 end)`,
        legacy: sql<number>`sum(case when ${products.legacy} = 1 then 1 else 0 end)`,
      })
      .from(products);
    const orderCounts = await db
      .select({ status: shopOrders.status, mode: shopOrders.mode, n: sql<number>`count(*)` })
      .from(shopOrders)
      .groupBy(shopOrders.status, shopOrders.mode);
    const shipping = await getShipping();
    const stripe = await getStripePublicStatus();
    return {
      products: {
        published: Number(counts?.published ?? 0),
        drafts: Number(counts?.drafts ?? 0),
        outOfStock: Number(counts?.outOfStock ?? 0),
        legacy: Number(counts?.legacy ?? 0),
      },
      orders: orderCounts,
      readiness: {
        shipping: !!shipping,
        stripeTest: !!stripe.testSecretKey,
        stripeWebhook: !!stripe.testWebhookSecret,
        stripeLive: false,
        legalPublished: false,
        salesOpen: SALES_OPEN,
      },
    };
  }),

  orders: {
    list: adminOnly
      .input(z.object({ status: z.enum(ORDER_STATUSES).optional() }).optional())
      .handler(async ({ input }) => {
        await sweepExpired();
        const rows = await db
          .select()
          .from(shopOrders)
          .where(input?.status ? eq(shopOrders.status, input.status) : undefined)
          .orderBy(desc(shopOrders.createdAt))
          .limit(200);
        return rows.map((o) => ({
          id: o.id,
          code: o.code,
          mode: o.mode,
          status: o.status,
          customerName: o.customerName,
          city: o.city,
          province: o.province,
          totalCents: o.totalCents,
          itemCount: parseItems(o.items).reduce((s, i) => s + i.qty, 0),
          createdAt: o.createdAt,
          paidAt: o.paidAt,
        }));
      }),

    get: adminOnly.input(z.object({ id: z.string().uuid() })).handler(async ({ input }) => {
      await reconcileOrder(input.id);
      const [o] = await db.select().from(shopOrders).where(eq(shopOrders.id, input.id));
      if (!o) throw new ORPCError("NOT_FOUND", { message: "Ordine non trovato" });
      const { accessTokenHash: _hidden, ...rest } = o;
      return { ...rest, items: parseItems(o.items) };
    }),

    update: adminOnly
      .input(
        z.object({
          id: z.string().uuid(),
          action: z.enum(["shipped", "delivered", "paid", "paid_confirmed", "canceled_review", "note"]),
          carrier: z.string().trim().max(80).optional(),
          trackingNumber: z.string().trim().max(120).optional(),
          adminNote: z.string().trim().max(2000).optional(),
        }),
      )
      .handler(async ({ input }) => {
        const [o] = await db.select().from(shopOrders).where(eq(shopOrders.id, input.id));
        if (!o) throw new ORPCError("NOT_FOUND", { message: "Ordine non trovato" });
        const now = new Date();
        if (input.action === "note") {
          await db
            .update(shopOrders)
            .set({ adminNote: input.adminNote ?? "", updatedAt: now })
            .where(eq(shopOrders.id, o.id));
          return { ok: true };
        }
        if (!MANUAL[o.status]?.includes(input.action)) {
          throw new ORPCError("BAD_REQUEST", { message: "Cambio di stato non consentito" });
        }
        const set: Partial<typeof shopOrders.$inferInsert> = { updatedAt: now };
        if (input.action === "shipped") {
          if (!input.trackingNumber) throw new ORPCError("BAD_REQUEST", { message: "Inserisci il tracking" });
          Object.assign(set, {
            status: "shipped",
            shippedAt: o.shippedAt ?? now,
            carrier: input.carrier ?? o.carrier,
            trackingNumber: input.trackingNumber,
          });
        } else if (input.action === "delivered") set.status = "delivered";
        else if (input.action === "paid") set.status = "paid";
        else if (input.action === "paid_confirmed") {
          // Verificato manualmente dall'admin sul pannello Stripe.
          set.status = "paid";
          set.adminNote = `${o.adminNote}\n[Admin] Pagamento verificato manualmente su Stripe.`.trim();
        } else if (input.action === "canceled_review") set.status = "canceled";
        await db
          .update(shopOrders)
          .set(set)
          .where(and(eq(shopOrders.id, o.id), eq(shopOrders.status, o.status)));
        return { ok: true };
      }),
  },

  settings: {
    get: adminOnly.handler(async () => {
      const recent = await db
        .select()
        .from(stripeEvents)
        .orderBy(desc(stripeEvents.receivedAt))
        .limit(5);
      return {
        shipping: await getShipping(),
        stripe: await getStripePublicStatus(),
        webhookUrl: `${siteUrl()}/api/webhooks/stripe`,
        webhookEvents: [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
          "checkout.session.async_payment_failed",
          "checkout.session.expired",
        ],
        recentEvents: recent,
      };
    }),

    saveShipping: adminOnly.input(shippingSchema).handler(async ({ input }) => {
      await saveShipping(input);
      return { ok: true };
    }),

    saveStripe: adminOnly
      .input(
        z.object({
          testSecretKey: z
            .string()
            .trim()
            .regex(/^(sk|rk)_test_[A-Za-z0-9]{10,}$/, "Serve una chiave segreta di TEST (sk_test_… o rk_test_…)")
            .optional(),
          testWebhookSecret: z
            .string()
            .trim()
            .regex(/^whsec_[A-Za-z0-9+/=]{10,}$/, "Il segreto webhook inizia con whsec_")
            .optional(),
        }),
      )
      .handler(async ({ input }) => {
        if (!input.testSecretKey && !input.testWebhookSecret) {
          throw new ORPCError("BAD_REQUEST", { message: "Nessun valore da salvare" });
        }
        let accountName: string | undefined;
        if (input.testSecretKey) {
          try {
            accountName = await verifyStripeKey(input.testSecretKey);
          } catch (err) {
            const msg = err instanceof StripeError ? err.message : "Stripe non raggiungibile";
            throw new ORPCError("BAD_REQUEST", { message: `Chiave rifiutata da Stripe: ${msg}` });
          }
        }
        await saveStripeSecrets({ ...input, accountName });
        return getStripePublicStatus();
      }),

    clearStripe: adminOnly.handler(async () => {
      await clearStripeSecrets();
      return getStripePublicStatus();
    }),
  },
};

