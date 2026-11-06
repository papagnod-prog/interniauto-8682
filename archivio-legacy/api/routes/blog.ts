import { desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";

export const blog = {
  list: base
    .input(z.object({ category: z.string().optional(), limit: z.number().optional() }).optional())
    .handler(async ({ input }) => {
      const rows = await db.select().from(schema.posts).orderBy(desc(schema.posts.publishedAt));
      const filtered = input?.category
        ? rows.filter((r) => r.category === input.category)
        : rows;
      return input?.limit ? filtered.slice(0, input.limit) : filtered;
    }),

  get: base.input(z.object({ slug: z.string() })).handler(async ({ input }) => {
    const [row] = await db.select().from(schema.posts).where(eq(schema.posts.slug, input.slug));
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Articolo non trovato" });
    const others = await db.select().from(schema.posts).orderBy(desc(schema.posts.publishedAt));
    return { post: row, related: others.filter((o) => o.slug !== row.slug).slice(0, 3) };
  }),
};
