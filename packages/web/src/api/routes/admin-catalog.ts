import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { db } from "../database";
import { categories, productCategories, products, shopOrders } from "../database/schema";
import { adminOnly } from "../middleware/auth";
import { isOwnPublicUrl, publicUrl, s3 } from "../lib/s3";
import { parseImages, parseItems } from "../lib/shop";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function uniqueSlug(table: typeof products | typeof categories, wanted: string, exceptId?: number) {
  const root = slugify(wanted) || "articolo";
  for (let n = 1; n < 200; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const [hit] = await db
      .select({ id: table.id })
      .from(table)
      .where(exceptId ? and(eq(table.slug, candidate), ne(table.id, exceptId)) : eq(table.slug, candidate));
    if (!hit) return candidate;
  }
  throw new ORPCError("CONFLICT", { message: "Slug non disponibile" });
}

const productInput = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2).max(140),
  slug: z.string().trim().max(90).optional(),
  brand: z.string().trim().max(80).default(""),
  compatibility: z.string().trim().max(1000).default(""),
  condition: z.enum(["nuovo", "usato"]),
  description: z.string().trim().max(6000).default(""),
  priceCents: z.number().int().min(0).max(5_000_000),
  stock: z.number().int().min(0).max(10_000),
  sku: z.string().trim().max(60).default(""),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]),
  categoryIds: z.array(z.number().int().positive()).max(10).default([]),
  images: z.array(z.string().url().max(500)).max(12).default([]),
});

async function productWithLinks(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id));
  if (!row) throw new ORPCError("NOT_FOUND", { message: "Prodotto non trovato" });
  const links = await db
    .select({ categoryId: productCategories.categoryId })
    .from(productCategories)
    .where(eq(productCategories.productId, id));
  return { ...row, images: parseImages(row.images), categoryIds: links.map((l) => l.categoryId) };
}

export const adminCatalog = {
  products: {
    list: adminOnly
      .input(z.object({ scope: z.enum(["current", "legacy"]).default("current") }).optional())
      .handler(async ({ input }) => {
        const rows = await db
          .select()
          .from(products)
          .where(eq(products.legacy, input?.scope === "legacy"))
          .orderBy(desc(products.updatedAt), desc(products.createdAt));
        const links = rows.length
          ? await db
              .select({ productId: productCategories.productId, name: categories.name })
              .from(productCategories)
              .innerJoin(categories, eq(categories.id, productCategories.categoryId))
              .where(inArray(productCategories.productId, rows.map((r) => r.id)))
          : [];
        return rows.map((r) => ({
          id: r.id,
          slug: r.slug,
          name: r.name,
          brand: r.brand,
          priceCents: r.priceCents,
          stock: r.stock,
          status: r.status,
          featured: r.featured,
          legacy: r.legacy,
          image: r.legacy ? null : (parseImages(r.images)[0] ?? null),
          imageCount: parseImages(r.images).length,
          categories: links.filter((l) => l.productId === r.id).map((l) => l.name),
          updatedAt: r.updatedAt ?? r.createdAt,
        }));
      }),

    get: adminOnly.input(z.object({ id: z.number().int().positive() })).handler(async ({ input }) => {
      const p = await productWithLinks(input.id);
      if (p.legacy) throw new ORPCError("FORBIDDEN", { message: "Prodotto del vecchio sito: solo archivio" });
      return p;
    }),

    save: adminOnly.input(productInput).handler(async ({ input }) => {
      if (input.id) {
        const [existing] = await db.select().from(products).where(eq(products.id, input.id));
        if (!existing) throw new ORPCError("NOT_FOUND", { message: "Prodotto non trovato" });
        if (existing.legacy) {
          throw new ORPCError("FORBIDDEN", { message: "I prodotti del vecchio sito non sono modificabili" });
        }
      }
      const badImage = input.images.find((u) => !isOwnPublicUrl(u));
      if (badImage) throw new ORPCError("BAD_REQUEST", { message: "Immagine non caricata dalla dashboard" });
      if (input.status === "published") {
        const missing: string[] = [];
        if (input.priceCents <= 0) missing.push("prezzo");
        if (!input.images.length) missing.push("almeno una foto");
        if (!input.categoryIds.length) missing.push("una categoria");
        if (missing.length) {
          throw new ORPCError("BAD_REQUEST", { message: `Per pubblicare servono: ${missing.join(", ")}.` });
        }
      }
      const cats = input.categoryIds.length
        ? await db
            .select({ id: categories.id })
            .from(categories)
            .where(and(inArray(categories.id, input.categoryIds), eq(categories.legacy, false)))
        : [];
      if (cats.length !== new Set(input.categoryIds).size) {
        throw new ORPCError("BAD_REQUEST", { message: "Categoria non valida" });
      }

      const slug = await uniqueSlug(products, input.slug || input.name, input.id);
      const values = {
        name: input.name,
        slug,
        brand: input.brand,
        compatibility: input.compatibility,
        condition: input.condition,
        description: input.description,
        priceCents: input.priceCents,
        stock: input.stock,
        sku: input.sku,
        featured: input.featured,
        status: input.status,
        active: input.status === "published",
        images: JSON.stringify(input.images),
        updatedAt: new Date(),
      };
      let id = input.id;
      if (id) {
        await db.update(products).set(values).where(and(eq(products.id, id), eq(products.legacy, false)));
      } else {
        const [row] = await db
          .insert(products)
          .values({ ...values, legacy: false })
          .returning({ id: products.id });
        id = row!.id;
      }
      await db.delete(productCategories).where(eq(productCategories.productId, id));
      if (cats.length) {
        await db.insert(productCategories).values(cats.map((c) => ({ productId: id!, categoryId: c.id })));
      }
      return productWithLinks(id);
    }),

    remove: adminOnly.input(z.object({ id: z.number().int().positive() })).handler(async ({ input }) => {
      const [p] = await db.select().from(products).where(eq(products.id, input.id));
      if (!p) throw new ORPCError("NOT_FOUND", { message: "Prodotto non trovato" });
      if (p.legacy) throw new ORPCError("FORBIDDEN", { message: "Il vecchio catalogo non si cancella" });
      if (p.status === "published") {
        throw new ORPCError("BAD_REQUEST", { message: "Archivia o riporta in bozza prima di eliminare" });
      }
      const orders = await db.select({ items: shopOrders.items }).from(shopOrders);
      if (orders.some((o) => parseItems(o.items).some((i) => i.productId === p.id))) {
        throw new ORPCError("CONFLICT", { message: "Prodotto presente in ordini: archivialo invece di eliminarlo" });
      }
      await db.delete(products).where(and(eq(products.id, p.id), eq(products.legacy, false)));
      return { ok: true };
    }),
  },

  categories: {
    list: adminOnly.handler(async () => {
      const cats = await db
        .select()
        .from(categories)
        .where(eq(categories.legacy, false))
        .orderBy(asc(categories.sortOrder), asc(categories.name));
      const counts = await db
        .select({ categoryId: productCategories.categoryId, n: sql<number>`count(*)` })
        .from(productCategories)
        .groupBy(productCategories.categoryId);
      return cats.map((c) => ({ ...c, products: counts.find((x) => x.categoryId === c.id)?.n ?? 0 }));
    }),

    save: adminOnly
      .input(
        z.object({
          id: z.number().int().positive().optional(),
          name: z.string().trim().min(2).max(60),
          description: z.string().trim().max(400).default(""),
          visible: z.boolean(),
          sortOrder: z.number().int().min(0).max(999).default(0),
        }),
      )
      .handler(async ({ input }) => {
        if (input.id) {
          const [c] = await db.select().from(categories).where(eq(categories.id, input.id));
          if (!c || c.legacy) throw new ORPCError("NOT_FOUND", { message: "Categoria non trovata" });
          await db
            .update(categories)
            .set({ name: input.name, description: input.description, visible: input.visible, sortOrder: input.sortOrder })
            .where(eq(categories.id, input.id));
          return { id: input.id };
        }
        const slug = await uniqueSlug(categories, input.name);
        const [row] = await db
          .insert(categories)
          .values({ ...input, slug, legacy: false })
          .returning({ id: categories.id });
        return { id: row!.id };
      }),

    remove: adminOnly.input(z.object({ id: z.number().int().positive() })).handler(async ({ input }) => {
      const [c] = await db.select().from(categories).where(eq(categories.id, input.id));
      if (!c || c.legacy) throw new ORPCError("NOT_FOUND", { message: "Categoria non trovata" });
      const [link] = await db
        .select({ id: productCategories.id })
        .from(productCategories)
        .where(eq(productCategories.categoryId, input.id))
        .limit(1);
      if (link) throw new ORPCError("CONFLICT", { message: "Categoria usata da prodotti: spostali prima" });
      await db.delete(categories).where(and(eq(categories.id, input.id), eq(categories.legacy, false)));
      return { ok: true };
    }),
  },

  /** URL firmato (10 minuti) per caricare una foto prodotto direttamente su Tigris. */
  presignImage: adminOnly
    .input(
      z.object({
        contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif"]),
        size: z.number().int().min(1).max(10 * 1024 * 1024),
      }),
    )
    .handler(async ({ input }) => {
      const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[
        input.contentType
      ];
      const month = new Date().toISOString().slice(0, 7);
      const key = `products/${month}/${randomUUID()}.${ext}`;
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          ContentType: input.contentType,
          ContentLength: input.size,
          ACL: "public-read",
        }),
        { expiresIn: 600, signableHeaders: new Set(["x-amz-acl", "content-length", "content-type"]) },
      );
      return { url, publicUrl: publicUrl(key) };
    }),
};
