import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import { categories, productCategories, products } from "../database/schema";
import { withUser } from "../middleware/auth";
import { business, LEGAL_TERMS_PUBLISHED } from "../lib/business";
import { getShipping, getStripeSecrets } from "../lib/settings";
import { isPublic, parseImages } from "../lib/shop";

export type PublicProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  compatibility: string;
  condition: string;
  description: string;
  priceCents: number;
  images: string[];
  featured: boolean;
  inStock: boolean;
  lowStock: number | null;
  categories: { slug: string; name: string }[];
};

type ProductRow = typeof products.$inferSelect;

async function withCategories(rows: ProductRow[]): Promise<PublicProduct[]> {
  const links = rows.length
    ? await db
        .select({
          productId: productCategories.productId,
          slug: categories.slug,
          name: categories.name,
        })
        .from(productCategories)
        .innerJoin(categories, eq(categories.id, productCategories.categoryId))
        .where(
          and(
            inArray(
              productCategories.productId,
              rows.map((r) => r.id),
            ),
            eq(categories.visible, true),
            eq(categories.legacy, false),
          ),
        )
        .orderBy(asc(categories.sortOrder))
    : [];
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    compatibility: r.compatibility,
    condition: r.condition,
    description: r.description,
    priceCents: r.priceCents,
    images: parseImages(r.images),
    featured: r.featured,
    inStock: r.stock > 0,
    lowStock: r.stock > 0 && r.stock <= 3 ? r.stock : null,
    categories: links.filter((l) => l.productId === r.id).map(({ slug, name }) => ({ slug, name })),
  }));
}

/** Vendita al pubblico: chiusa finché i testi legali non sono pubblicati e Stripe live non è attivo. */
export const SALES_OPEN = LEGAL_TERMS_PUBLISHED && false;

export const shop = {
  info: withUser.handler(async ({ context }) => {
    const shipping = await getShipping();
    const stripe = context.isAdmin ? await getStripeSecrets() : null;
    return {
      business,
      salesOpen: SALES_OPEN,
      shipping: shipping
        ? {
            flatRateCents: shipping.flatRateCents,
            freeOverCents: shipping.freeOverCents,
            carrier: shipping.carrier,
            deliveryTime: shipping.deliveryTime,
            note: shipping.note,
          }
        : null,
      viewerIsAdmin: context.isAdmin,
      /** Solo per l'admin: il checkout di prova è utilizzabile? */
      testCheckoutReady: context.isAdmin ? !!stripe?.testSecretKey && !!shipping : false,
    };
  }),

  categories: base.handler(async () => {
    const cats = await db
      .select({ id: categories.id, slug: categories.slug, name: categories.name, description: categories.description })
      .from(categories)
      .where(and(eq(categories.visible, true), eq(categories.legacy, false)))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    const links = cats.length
      ? await db
          .select({ categoryId: productCategories.categoryId })
          .from(productCategories)
          .innerJoin(products, eq(products.id, productCategories.productId))
          .where(and(isPublic, inArray(productCategories.categoryId, cats.map((c) => c.id))))
      : [];
    return cats.map((c) => ({ ...c, count: links.filter((l) => l.categoryId === c.id).length }));
  }),

  products: base
    .input(
      z
        .object({
          category: z.string().max(80).optional(),
          q: z.string().max(80).optional(),
          sort: z.enum(["recenti", "prezzo-asc", "prezzo-desc"]).optional(),
          featured: z.boolean().optional(),
        })
        .optional(),
    )
    .handler(async ({ input }) => {
      const rows = await db.select().from(products).where(isPublic).orderBy(desc(products.createdAt));
      let items = await withCategories(rows);
      if (input?.category) items = items.filter((p) => p.categories.some((c) => c.slug === input.category));
      if (input?.featured) items = items.filter((p) => p.featured);
      const q = input?.q?.trim().toLowerCase();
      if (q) {
        items = items.filter((p) =>
          `${p.name} ${p.brand} ${p.compatibility}`.toLowerCase().includes(q),
        );
      }
      if (input?.sort === "prezzo-asc") items.sort((a, b) => a.priceCents - b.priceCents);
      if (input?.sort === "prezzo-desc") items.sort((a, b) => b.priceCents - a.priceCents);
      return items;
    }),

  product: base.input(z.object({ slug: z.string().max(160) })).handler(async ({ input }) => {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, input.slug), isPublic));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Prodotto non trovato" });
    const [product] = await withCategories([row]);
    const others = await withCategories(
      await db.select().from(products).where(isPublic).orderBy(desc(products.createdAt)).limit(40),
    );
    const related = others
      .filter((p) => p.id !== row.id)
      .sort(
        (a, b) =>
          Number(b.categories.some((c) => product!.categories.some((x) => x.slug === c.slug))) -
          Number(a.categories.some((c) => product!.categories.some((x) => x.slug === c.slug))),
      )
      .slice(0, 3);
    return { product: product!, related };
  }),
};
