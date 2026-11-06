import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Schema Interni Auto — Luxury Boutique.
 * Le tabelle legacy (orders, posts, admins, bot_sessions) restano definite qui solo
 * perché `db:push` non le elimini: nessuna API le espone (vedi archivio-legacy/LEGGIMI.md).
 * Tutte le modifiche di Fase 2 sono additive.
 */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  /** Fase 2: categorie del vecchio sito, mai mostrate. */
  legacy: integer("legacy", { mode: "boolean" }).notNull().default(false),
  /** Fase 2: visibile nel negozio pubblico. */
  visible: integer("visible", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  description: text("description").notNull().default(""),
  /** JSON array di percorsi immagine (/images/products/...) */
  images: text("images").notNull().default("[]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  // ── Fase 2 (additive) ──
  /** draft | published | archived — il negozio mostra solo "published". */
  status: text("status").notNull().default("draft"),
  /** Prodotti del vecchio sito: mai pubblicabili. */
  legacy: integer("legacy", { mode: "boolean" }).notNull().default(false),
  /** Pezzi disponibili (decrementati alla prenotazione del checkout). */
  stock: integer("stock").notNull().default(0),
  brand: text("brand").notNull().default(""),
  /** Testo libero: modelli/anni compatibili. */
  compatibility: text("compatibility").notNull().default(""),
  /** nuovo | usato */
  condition: text("condition").notNull().default("nuovo"),
  sku: text("sku").notNull().default(""),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const productCategories = sqliteTable(
  "product_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("product_category_unique").on(t.productId, t.categoryId)],
);

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  /** ritiro | spedizione */
  shipping: text("shipping").notNull().default("ritiro"),
  /** carta | bonifico | contanti */
  paymentMethod: text("payment_method").notNull(),
  note: text("note").notNull().default(""),
  /** JSON: [{ productId, name, priceCents, qty }] */
  items: text("items").notNull().default("[]"),
  totalCents: integer("total_cents").notNull(),
  paymentUrl: text("payment_url"),
  /** nuovo | inviato | pagato | annullato */
  status: text("status").notNull().default("nuovo"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  category: text("category").notNull().default("Mondo Auto"),
  cover: text("cover"),
  publishedAt: text("published_at").notNull(),
});

/** Chat Telegram abilitate a gestire il catalogo */
export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: text("chat_id").notNull().unique(),
  name: text("name").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Stato conversazionale del bot Telegram (wizard nuovo articolo) */
export const botSessions = sqliteTable("bot_sessions", {
  chatId: text("chat_id").primaryKey(),
  /** JSON con step e dati parziali */
  state: text("state").notNull().default("{}"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────── Fase 2: negozio ───────────────────────────

/** Impostazioni chiave/valore (JSON). I segreti sono cifrati AES-256-GCM. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Ordini del nuovo negozio (checkout Stripe). Separati dagli ordini legacy. */
export const shopOrders = sqliteTable("shop_orders", {
  id: text("id").primaryKey(),
  /** Codice mostrato al cliente, casuale (es. IA-7K2M9QXD). */
  code: text("code").notNull().unique(),
  /** SHA-256 del token della pagina di conferma: il token in chiaro non viene salvato. */
  accessTokenHash: text("access_token_hash").notNull().unique(),
  /** test | live */
  mode: text("mode").notNull(),
  /** pending_payment | paid | expired | canceled | shipped | delivered | review */
  status: text("status").notNull().default("pending_payment"),
  /** reserved | committed | released */
  stockState: text("stock_state").notNull().default("reserved"),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2").notNull().default(""),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  country: text("country").notNull().default("IT"),
  customerNote: text("customer_note").notNull().default(""),
  /** JSON: [{ productId, slug, name, unitCents, qty, image }] */
  items: text("items").notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull().default("eur"),
  stripeSessionId: text("stripe_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  reservationExpiresAt: integer("reservation_expires_at", { mode: "timestamp" }).notNull(),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  shippedAt: integer("shipped_at", { mode: "timestamp" }),
  carrier: text("carrier").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Eventi webhook Stripe già ricevuti (idempotenza). */
export const stripeEvents = sqliteTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  mode: text("mode").notNull(),
  receivedAt: integer("received_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
export * from "./auth-schema";
