import { eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { formatEuro, shop } from "../lib/config";
import { createPaymentLink } from "../lib/stripe";

const paymentLabels = {
  carta: "Carta / Apple Pay (Stripe)",
  bonifico: "Bonifico bancario",
  contanti: "Contanti al ritiro",
} as const;

const createInput = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(6),
  email: z.string().email().or(z.literal("")).default(""),
  city: z.string().default(""),
  address: z.string().default(""),
  shipping: z.enum(["ritiro", "spedizione"]).default("ritiro"),
  paymentMethod: z.enum(["carta", "bonifico", "contanti"]),
  note: z.string().max(600).default(""),
  items: z
    .array(z.object({ productId: z.number(), qty: z.number().int().min(1).max(20) }))
    .min(1),
});

function orderCode() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  const d = new Date();
  return `IA${d.getFullYear().toString().slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${n}`;
}

export const orders = {
  /** Crea l'ordine, genera il link di pagamento e restituisce il link wa.me precompilato. */
  create: base.input(createInput).handler(async ({ input }) => {
    const rows = await db
      .select()
      .from(schema.products)
      .where(
        inArray(
          schema.products.id,
          input.items.map((i) => i.productId),
        ),
      );
    if (!rows.length) throw new ORPCError("BAD_REQUEST", { message: "Carrello vuoto o non valido" });

    const items = input.items.flatMap((i) => {
      const p = rows.find((r) => r.id === i.productId);
      if (!p) return [];
      return [{ productId: p.id, name: p.name, priceCents: p.priceCents, qty: i.qty }];
    });
    if (!items.length) throw new ORPCError("BAD_REQUEST", { message: "Prodotti non disponibili" });

    const subtotal = items.reduce((s, i) => s + i.priceCents * i.qty, 0);
    const shippingCents = input.shipping === "spedizione" ? shop.shippingCents : 0;
    const total = subtotal + shippingCents;
    const code = orderCode();

    let paymentUrl: string | null = null;
    if (input.paymentMethod === "carta") {
      paymentUrl = await createPaymentLink({
        items: items.map((i) => ({ name: i.name, priceCents: i.priceCents, qty: i.qty })),
        shippingCents,
        orderCode: code,
        customerEmail: input.email || undefined,
      });
    }

    const [order] = await db
      .insert(schema.orders)
      .values({
        code,
        customerName: input.customerName,
        phone: input.phone,
        email: input.email,
        city: input.city,
        address: input.address,
        shipping: input.shipping,
        paymentMethod: input.paymentMethod,
        note: input.note,
        items: JSON.stringify(items),
        totalCents: total,
        paymentUrl,
        status: "nuovo",
      })
      .returning();

    const lines: string[] = [];
    lines.push(`*NUOVO ORDINE ${code}*`);
    lines.push(`_${shop.name}_`);
    lines.push("");
    lines.push("*Articoli*");
    for (const i of items) {
      lines.push(`• ${i.qty}× ${i.name} — ${formatEuro(i.priceCents * i.qty)}`);
    }
    lines.push("");
    lines.push(`Subtotale: ${formatEuro(subtotal)}`);
    if (shippingCents > 0) lines.push(`Spedizione: ${formatEuro(shippingCents)}`);
    lines.push(`*TOTALE: ${formatEuro(total)}* (IVA inclusa)`);
    lines.push("");
    lines.push("*Cliente*");
    lines.push(`Nome: ${input.customerName}`);
    lines.push(`Telefono: ${input.phone}`);
    if (input.email) lines.push(`Email: ${input.email}`);
    lines.push(
      input.shipping === "spedizione"
        ? `Consegna: spedizione — ${input.address}${input.city ? `, ${input.city}` : ""}`
        : `Consegna: ritiro in sede (${shop.address})`,
    );
    lines.push("");
    lines.push(`*Pagamento:* ${paymentLabels[input.paymentMethod]}`);
    if (input.paymentMethod === "carta") {
      lines.push(
        paymentUrl
          ? `Link di pagamento: ${paymentUrl}`
          : "Link di pagamento: da generare (contattare il cliente)",
      );
    }
    if (input.paymentMethod === "bonifico") {
      lines.push(`Causale bonifico: ordine ${code}`);
    }
    if (input.note) {
      lines.push("");
      lines.push(`*Note:* ${input.note}`);
    }

    const message = lines.join("\n");
    const whatsappUrl = `https://wa.me/${shop.whatsappOrders}?text=${encodeURIComponent(message)}`;

    return { code, orderId: order!.id, totalCents: total, paymentUrl, whatsappUrl, message };
  }),

  /** Riepilogo pubblico di un ordine (pagina di conferma) */
  get: base.input(z.object({ code: z.string() })).handler(async ({ input }) => {
    const [row] = await db.select().from(schema.orders).where(eq(schema.orders.code, input.code));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Ordine non trovato" });
    return {
      code: row.code,
      customerName: row.customerName,
      totalCents: row.totalCents,
      paymentMethod: row.paymentMethod,
      paymentUrl: row.paymentUrl,
      status: row.status,
    };
  }),
};
