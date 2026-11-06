import { asc, desc, eq } from "drizzle-orm";
import { db } from "../database";
import * as schema from "../database/schema";
import { formatEuro } from "./config";
import { putMedia } from "./s3";

const API = (method: string) =>
  `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;

type TgMessage = {
  message_id: number;
  chat: { id: number };
  from?: { first_name?: string; username?: string };
  text?: string;
  caption?: string;
  photo?: { file_id: string; file_size?: number; width: number }[];
};
export type TgUpdate = { message?: TgMessage; edited_message?: TgMessage };

type Draft = {
  step: "nome" | "prezzo" | "categoria" | "descrizione" | "foto";
  name?: string;
  priceCents?: number;
  categoryIds?: number[];
  description?: string;
  images?: string[];
};

async function send(chatId: string, text: string, keyboard?: string[][]) {
  await fetch(API("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      reply_markup: keyboard
        ? { keyboard: keyboard.map((r) => r.map((t) => ({ text: t }))), resize_keyboard: true }
        : { remove_keyboard: true },
    }),
  });
}

async function isAdmin(chatId: string) {
  if (process.env.TELEGRAM_ADMIN_CHAT_ID === chatId) {
    await db.insert(schema.admins).values({ chatId, name: "Admin" }).onConflictDoNothing();
    return true;
  }
  const [row] = await db.select().from(schema.admins).where(eq(schema.admins.chatId, chatId));
  return Boolean(row);
}

async function getDraft(chatId: string): Promise<Draft | null> {
  const [row] = await db
    .select()
    .from(schema.botSessions)
    .where(eq(schema.botSessions.chatId, chatId));
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.state) as Draft;
    return parsed.step ? parsed : null;
  } catch {
    return null;
  }
}

async function setDraft(chatId: string, draft: Draft | null) {
  if (!draft) {
    await db.delete(schema.botSessions).where(eq(schema.botSessions.chatId, chatId));
    return;
  }
  await db
    .insert(schema.botSessions)
    .values({ chatId, state: JSON.stringify(draft), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.botSessions.chatId,
      set: { state: JSON.stringify(draft), updatedAt: new Date() },
    });
}

function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

async function uniqueSlug(base: string) {
  let slug = base || `articolo-${Date.now()}`;
  let i = 2;
  while (true) {
    const [row] = await db.select().from(schema.products).where(eq(schema.products.slug, slug));
    if (!row) return slug;
    slug = `${base}-${i++}`;
  }
}

async function downloadPhoto(fileId: string, slug: string, index: number) {
  const infoRes = await fetch(API(`getFile?file_id=${fileId}`));
  const info = (await infoRes.json()) as { ok: boolean; result?: { file_path?: string } };
  const path = info.result?.file_path;
  if (!path) return null;
  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${path}`,
  );
  const bytes = new Uint8Array(await fileRes.arrayBuffer());
  const ext = path.split(".").pop()?.toLowerCase() ?? "jpg";
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return putMedia(`prodotti/${slug}-${Date.now()}-${index}.${ext}`, bytes, type);
}

const HELP = `*Gestione catalogo Interni Auto Design*

/nuovo — aggiungi un articolo (procedura guidata)
/lista — elenco articoli con codice
/elimina _codice_ — rimuovi un articolo
/prezzo _codice_ _euro_ — aggiorna il prezzo
/categorie — elenco categorie
/ordini — ultimi ordini ricevuti
/annulla — interrompi la procedura in corso`;

async function listCategories() {
  return db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder));
}

async function handleCommand(chatId: string, text: string): Promise<boolean> {
  const [cmdRaw, ...args] = text.trim().split(/\s+/);
  const cmd = (cmdRaw ?? "").split("@")[0]?.toLowerCase();

  switch (cmd) {
    case "/start":
    case "/help":
      await send(chatId, HELP);
      return true;

    case "/annulla":
      await setDraft(chatId, null);
      await send(chatId, "Procedura annullata.");
      return true;

    case "/categorie": {
      const cats = await listCategories();
      await send(
        chatId,
        `*Categorie*\n${cats.map((c) => `${c.id}. ${c.name}`).join("\n")}`,
      );
      return true;
    }

    case "/lista": {
      const rows = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.active, true))
        .orderBy(desc(schema.products.createdAt));
      if (!rows.length) {
        await send(chatId, "Nessun articolo in catalogo.");
        return true;
      }
      const lines = rows.map((r) => `*${r.id}* — ${r.name}\n   ${formatEuro(r.priceCents)}`);
      await send(chatId, `*Catalogo (${rows.length})*\n\n${lines.join("\n")}`);
      return true;
    }

    case "/elimina": {
      const id = Number(args[0]);
      if (!id) {
        await send(chatId, "Usa: `/elimina 12` (il codice lo trovi con /lista)");
        return true;
      }
      const [row] = await db.select().from(schema.products).where(eq(schema.products.id, id));
      if (!row) {
        await send(chatId, "Articolo non trovato.");
        return true;
      }
      await db.update(schema.products).set({ active: false }).where(eq(schema.products.id, id));
      await send(chatId, `Articolo *${row.name}* rimosso dal sito.`);
      return true;
    }

    case "/prezzo": {
      const id = Number(args[0]);
      const euro = Number((args[1] ?? "").replace(",", "."));
      if (!id || !euro) {
        await send(chatId, "Usa: `/prezzo 12 180` per impostare 180,00 €");
        return true;
      }
      const [row] = await db.select().from(schema.products).where(eq(schema.products.id, id));
      if (!row) {
        await send(chatId, "Articolo non trovato.");
        return true;
      }
      await db
        .update(schema.products)
        .set({ priceCents: Math.round(euro * 100) })
        .where(eq(schema.products.id, id));
      await send(chatId, `Prezzo di *${row.name}* aggiornato a ${formatEuro(Math.round(euro * 100))}.`);
      return true;
    }

    case "/ordini": {
      const rows = await db
        .select()
        .from(schema.orders)
        .orderBy(desc(schema.orders.createdAt))
        .limit(5);
      if (!rows.length) {
        await send(chatId, "Nessun ordine ricevuto.");
        return true;
      }
      const lines = rows.map(
        (o) =>
          `*${o.code}* — ${o.customerName}\n   ${formatEuro(o.totalCents)} · ${o.paymentMethod} · ${o.status}`,
      );
      await send(chatId, `*Ultimi ordini*\n\n${lines.join("\n")}`);
      return true;
    }

    case "/nuovo": {
      await setDraft(chatId, { step: "nome", images: [] });
      await send(chatId, "Nuovo articolo.\n\n*1/5* — Come si chiama? (es. Volante Audi A1)");
      return true;
    }

    default:
      return false;
  }
}

async function handleDraft(chatId: string, draft: Draft, msg: TgMessage) {
  const text = (msg.text ?? msg.caption ?? "").trim();

  if (draft.step === "nome") {
    if (!text) return send(chatId, "Scrivi il nome dell'articolo.");
    draft.name = text;
    draft.step = "prezzo";
    await setDraft(chatId, draft);
    return send(chatId, "*2/5* — Prezzo in euro (es. 180 oppure 180,50)");
  }

  if (draft.step === "prezzo") {
    const euro = Number(text.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!euro) return send(chatId, "Prezzo non valido. Scrivi solo il numero, es. 180");
    draft.priceCents = Math.round(euro * 100);
    draft.step = "categoria";
    await setDraft(chatId, draft);
    const cats = await listCategories();
    return send(
      chatId,
      `*3/5* — Categoria: scrivi il numero (anche più di uno separato da virgola)\n\n${cats
        .map((c) => `${c.id}. ${c.name}`)
        .join("\n")}`,
      [cats.map((c) => String(c.id))],
    );
  }

  if (draft.step === "categoria") {
    const ids = text
      .split(/[,\s]+/)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n > 0);
    const cats = await listCategories();
    const valid = ids.filter((id) => cats.some((c) => c.id === id));
    if (!valid.length) return send(chatId, "Categoria non valida, scrivi il numero corrispondente.");
    draft.categoryIds = valid;
    draft.step = "descrizione";
    await setDraft(chatId, draft);
    return send(chatId, "*4/5* — Descrizione dell'articolo (oppure scrivi `-` per saltarla)");
  }

  if (draft.step === "descrizione") {
    draft.description = text === "-" ? "" : text;
    draft.step = "foto";
    await setDraft(chatId, draft);
    return send(
      chatId,
      "*5/5* — Invia ora le foto dell'articolo (anche più di una).\nQuando hai finito scrivi /fine",
    );
  }

  if (draft.step === "foto") {
    if (msg.photo?.length) {
      const best = msg.photo[msg.photo.length - 1]!;
      const slug = slugify(draft.name ?? "articolo");
      const url = await downloadPhoto(best.file_id, slug, (draft.images?.length ?? 0) + 1);
      if (url) {
        draft.images = [...(draft.images ?? []), url];
        await setDraft(chatId, draft);
        return send(chatId, `Foto ${draft.images.length} salvata. Invia altre foto o scrivi /fine`);
      }
      return send(chatId, "Non sono riuscito a salvare la foto, riprova.");
    }

    if (text.toLowerCase().startsWith("/fine")) {
      if (!draft.images?.length) {
        return send(chatId, "Serve almeno una foto prima di pubblicare.");
      }
      const slug = await uniqueSlug(slugify(draft.name ?? "articolo"));
      const [product] = await db
        .insert(schema.products)
        .values({
          slug,
          name: draft.name!,
          priceCents: draft.priceCents!,
          description: draft.description ?? "",
          images: JSON.stringify(draft.images),
          active: true,
          featured: false,
        })
        .returning();
      for (const categoryId of draft.categoryIds ?? []) {
        await db
          .insert(schema.productCategories)
          .values({ productId: product!.id, categoryId })
          .onConflictDoNothing();
      }
      await setDraft(chatId, null);
      return send(
        chatId,
        `Pubblicato! *${product!.name}* — ${formatEuro(product!.priceCents)}\nCodice: ${product!.id}\nOnline su /prodotti/${slug}`,
      );
    }

    return send(chatId, "Invia una foto oppure scrivi /fine per pubblicare.");
  }
}

export async function handleTelegramUpdate(update: TgUpdate) {
  const msg = update.message ?? update.edited_message;
  if (!msg) return;
  const chatId = String(msg.chat.id);
  const text = (msg.text ?? "").trim();

  if (!(await isAdmin(chatId))) {
    await send(
      chatId,
      `Questo bot è riservato alla gestione di *Interni Auto Design*.\nIl tuo chat ID è \`${chatId}\`: comunicalo all'amministratore per essere abilitato.`,
    );
    return;
  }

  if (text.startsWith("/") && !text.startsWith("/fine")) {
    const handled = await handleCommand(chatId, text);
    if (handled) return;
  }

  const draft = await getDraft(chatId);
  if (draft) {
    await handleDraft(chatId, draft, msg);
    return;
  }

  await send(chatId, HELP);
}
