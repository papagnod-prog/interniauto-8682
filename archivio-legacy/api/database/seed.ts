import { db } from "./index";
import * as schema from "./schema";
import seedData from "./seed-data.json";

type SeedCategory = { slug: string; name: string; description: string; image: string | null };
type SeedProduct = {
  slug: string;
  name: string;
  priceCents: number;
  description: string;
  categories: string[];
  images: string[];
};
type SeedPost = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover: string | null;
  publishedAt: string;
};

const data = seedData as {
  categories: SeedCategory[];
  products: SeedProduct[];
  posts: SeedPost[];
};

/** Importa catalogo e blog di interniautodesign.it nel database (idempotente). */
async function seed() {
  await db.delete(schema.productCategories);
  await db.delete(schema.products);
  await db.delete(schema.categories);
  await db.delete(schema.posts);

  const catIdBySlug = new Map<string, number>();
  const catIdByName = new Map<string, number>();
  for (const [i, c] of data.categories.entries()) {
    const [row] = await db
      .insert(schema.categories)
      .values({
        slug: c.slug,
        name: c.name,
        description: c.description,
        image: c.image,
        sortOrder: i,
      })
      .returning();
    catIdBySlug.set(c.slug, row!.id);
    catIdByName.set(c.name, row!.id);
  }

  for (const [i, p] of data.products.entries()) {
    const [row] = await db
      .insert(schema.products)
      .values({
        slug: p.slug,
        name: p.name,
        priceCents: p.priceCents,
        description: p.description,
        images: JSON.stringify(p.images),
        active: true,
        featured: i < 6,
      })
      .returning();
    for (const catName of p.categories) {
      const categoryId = catIdByName.get(catName);
      if (categoryId) {
        await db
          .insert(schema.productCategories)
          .values({ productId: row!.id, categoryId })
          .onConflictDoNothing();
      }
    }
  }

  for (const post of data.posts) {
    await db.insert(schema.posts).values({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      cover: post.cover,
      publishedAt: post.publishedAt,
    });
  }

  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId) {
    await db
      .insert(schema.admins)
      .values({ chatId: adminChatId, name: "Admin" })
      .onConflictDoNothing();
  }

  console.log(
    `Seed completato: ${data.categories.length} categorie, ${data.products.length} prodotti, ${data.posts.length} articoli`,
  );
}

seed();
