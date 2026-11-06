import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

export type ProductDTO = {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  description: string;
  images: string[];
  featured: boolean;
  categories: { slug: string; name: string }[];
};

function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function loadProducts(where?: { categorySlug?: string; onlyFeatured?: boolean }) {
  const rows = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.active, true))
    .orderBy(desc(schema.products.createdAt));

  const links = rows.length
    ? await db
        .select({
          productId: schema.productCategories.productId,
          slug: schema.categories.slug,
          name: schema.categories.name,
        })
        .from(schema.productCategories)
        .innerJoin(schema.categories, eq(schema.categories.id, schema.productCategories.categoryId))
        .where(
          inArray(
            schema.productCategories.productId,
            rows.map((r) => r.id),
          ),
        )
    : [];

  const byProduct = new Map<number, { slug: string; name: string }[]>();
  for (const l of links) {
    const list = byProduct.get(l.productId) ?? [];
    list.push({ slug: l.slug, name: l.name });
    byProduct.set(l.productId, list);
  }

  let items: ProductDTO[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    priceCents: r.priceCents,
    description: r.description,
    images: parseImages(r.images),
    featured: r.featured,
    categories: byProduct.get(r.id) ?? [],
  }));

  if (where?.categorySlug) {
    items = items.filter((p) => p.categories.some((c) => c.slug === where.categorySlug));
  }
  if (where?.onlyFeatured) {
    items = items.filter((p) => p.featured);
  }
  return items;
}

export const catalog = {
  categories: base.handler(async () => {
    const cats = await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));
    const counts = await db
      .select({
        categoryId: schema.productCategories.categoryId,
        productId: schema.productCategories.productId,
      })
      .from(schema.productCategories)
      .innerJoin(schema.products, eq(schema.products.id, schema.productCategories.productId))
      .where(eq(schema.products.active, true));

    return cats.map((c) => ({
      ...c,
      count: counts.filter((x) => x.categoryId === c.id).length,
    }));
  }),

  products: base
    .input(
      z
        .object({
          category: z.string().optional(),
          featured: z.boolean().optional(),
        })
        .optional(),
    )
    .handler(({ input }) =>
      loadProducts({ categorySlug: input?.category, onlyFeatured: input?.featured }),
    ),

  product: base.input(z.object({ slug: z.string() })).handler(async ({ input }) => {
    const [row] = await db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.slug, input.slug), eq(schema.products.active, true)));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Prodotto non trovato" });

    const cats = await db
      .select({ slug: schema.categories.slug, name: schema.categories.name })
      .from(schema.productCategories)
      .innerJoin(schema.categories, eq(schema.categories.id, schema.productCategories.categoryId))
      .where(eq(schema.productCategories.productId, row.id));

    const product: ProductDTO = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      priceCents: row.priceCents,
      description: row.description,
      images: parseImages(row.images),
      featured: row.featured,
      categories: cats,
    };

    const related = (await loadProducts()).filter(
      (p) => p.id !== row.id && p.categories.some((c) => cats.some((x) => x.slug === c.slug)),
    );

    return { product, related: related.slice(0, 4) };
  }),
};
