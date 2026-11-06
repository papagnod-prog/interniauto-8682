import { useId, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { AdminHead, AdminLoading } from "../../components/admin-layout";
import { errorMessage } from "../../lib/format";
import {
  useAdminCategories,
  useAdminProduct,
  usePresignImage,
  useRemoveProduct,
  useSaveProduct,
} from "../../queries/admin";

type Status = "draft" | "published" | "archived";
type FormState = {
  name: string;
  slug: string;
  brand: string;
  compatibility: string;
  condition: "nuovo" | "usato";
  description: string;
  price: string;
  stock: string;
  sku: string;
  featured: boolean;
  status: Status;
  categoryIds: number[];
  images: string[];
};

const EMPTY: FormState = {
  name: "",
  slug: "",
  brand: "",
  compatibility: "",
  condition: "nuovo",
  description: "",
  price: "",
  stock: "1",
  sku: "",
  featured: false,
  status: "draft",
  categoryIds: [],
  images: [],
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
type Accepted = (typeof ACCEPTED)[number];
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 12;

/** "1.234,50" | "1234.5" → 123450. null se non valido. */
function parseEuro(value: string): number | null {
  const clean = value.trim().replace(/\s|€/g, "");
  if (!clean) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

const centsToInput = (cents: number) => (cents ? (cents / 100).toFixed(2).replace(".", ",") : "");

export default function AdminProductEditPage({ id }: { id: number | null }) {
  const product = useAdminProduct(id);

  if (id && product.isLoading) return <AdminLoading />;
  if (id && (product.isError || !product.data)) {
    return (
      <>
        <BackLink />
        <p className="bp-error">{errorMessage(product.error, "Prodotto non trovato.")}</p>
      </>
    );
  }
  const p = product.data;
  const initial: FormState = p
    ? {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        compatibility: p.compatibility,
        condition: p.condition === "usato" ? "usato" : "nuovo",
        description: p.description ?? "",
        price: centsToInput(p.priceCents),
        stock: String(p.stock),
        sku: p.sku,
        featured: p.featured,
        status: (["draft", "published", "archived"].includes(p.status) ? p.status : "draft") as Status,
        categoryIds: p.categoryIds,
        images: p.images,
      }
    : EMPTY;

  return <ProductForm key={id ?? "new"} id={id} initial={initial} />;
}

function BackLink() {
  return (
    <Link to="/admin/prodotti" className="bp-text-link" style={{ display: "inline-flex", gap: 8, marginBottom: 18 }}>
      <ArrowLeft size={14} aria-hidden="true" /> Tutti i prodotti
    </Link>
  );
}

function ProductForm({ id, initial }: { id: number | null; initial: FormState }) {
  const [, navigate] = useLocation();
  const uid = useId();
  const categories = useAdminCategories();
  const save = useSaveProduct();
  const remove = useRemoveProduct();
  const presign = usePresignImage();

  const [form, setForm] = useState<FormState>(initial);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved("");
  };

  const priceCents = parseEuro(form.price);
  const stock = Number.parseInt(form.stock, 10);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadError("");
    const room = MAX_IMAGES - form.images.length;
    const list = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > list.length) setUploadError(`Massimo ${MAX_IMAGES} foto per prodotto.`);
    for (const file of list) {
      if (!ACCEPTED.includes(file.type as Accepted)) {
        setUploadError(`${file.name}: formato non supportato (usa JPG, PNG, WebP o AVIF).`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setUploadError(`${file.name}: supera 10 MB.`);
        continue;
      }
      setUploading((n) => n + 1);
      try {
        const { url, publicUrl } = await presign.mutateAsync({ contentType: file.type as Accepted, size: file.size });
        // Upload diretto su Tigris con URL firmato (unica fetch manuale consentita).
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type, "x-amz-acl": "public-read" },
          body: file,
        });
        if (!res.ok) throw new Error(`Caricamento non riuscito (${res.status})`);
        setForm((f) => ({ ...f, images: [...f.images, publicUrl].slice(0, MAX_IMAGES) }));
        setSaved("");
      } catch (err) {
        setUploadError(`${file.name}: ${errorMessage(err, "caricamento non riuscito")}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const moveImage = (index: number, delta: number) => {
    setForm((f) => {
      const images = [...f.images];
      const target = index + delta;
      if (target < 0 || target >= images.length) return f;
      [images[index], images[target]] = [images[target]!, images[index]!];
      return { ...f, images };
    });
    setSaved("");
  };
  const makeCover = (index: number) => {
    setForm((f) => {
      const images = [...f.images];
      const [img] = images.splice(index, 1);
      return { ...f, images: [img!, ...images] };
    });
    setSaved("");
  };
  const dropImage = (index: number) => set("images", form.images.filter((_, i) => i !== index));

  const toggleCategory = (catId: number) =>
    set(
      "categoryIds",
      form.categoryIds.includes(catId) ? form.categoryIds.filter((c) => c !== catId) : [...form.categoryIds, catId],
    );

  const submit = async (status: Status) => {
    setError("");
    setSaved("");
    if (form.name.trim().length < 2) return setError("Inserisci il nome del prodotto.");
    if (form.price.trim() && priceCents === null) return setError("Prezzo non valido. Esempio: 249,00");
    if (!Number.isInteger(stock) || stock < 0) return setError("Giacenza non valida.");
    if (status === "published") {
      const missing: string[] = [];
      if (!priceCents) missing.push("prezzo");
      if (!form.images.length) missing.push("almeno una foto");
      if (!form.categoryIds.length) missing.push("una categoria");
      if (missing.length) return setError(`Per pubblicare servono: ${missing.join(", ")}.`);
    }
    try {
      const result = await save.mutateAsync({
        ...(id ? { id } : {}),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        brand: form.brand,
        compatibility: form.compatibility,
        condition: form.condition,
        description: form.description,
        priceCents: priceCents ?? 0,
        stock,
        sku: form.sku,
        featured: form.featured,
        status,
        categoryIds: form.categoryIds,
        images: form.images,
      });
      setForm((f) => ({ ...f, status, slug: result.slug }));
      setSaved(status === "published" ? "Pubblicato." : status === "archived" ? "Archiviato." : "Bozza salvata.");
      if (!id) navigate(`/admin/prodotti/${result.id}`, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const destroy = async () => {
    if (!id) return;
    if (!window.confirm(`Eliminare definitivamente "${form.name}"? Le foto restano nell'archivio file.`)) return;
    setError("");
    try {
      await remove.mutateAsync({ id });
      navigate("/admin/prodotti", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const busy = save.isPending || remove.isPending || uploading > 0;
  const f = (name: string) => `${uid}-${name}`;

  return (
    <>
      <BackLink />
      <AdminHead
        eyebrow={id ? "MODIFICA PRODOTTO" : "NUOVO PRODOTTO"}
        title={form.name.trim() || "Senza nome"}
        text={
          form.status === "published"
            ? `Pubblicato · /prodotto/${form.slug}`
            : form.status === "archived"
              ? "Archiviato: non visibile nel negozio."
              : "Bozza: non visibile nel negozio."
        }
      >
        {id && form.status === "published" && (
          <a className="bp-button bp-button-outline bp-button-small" href={`/prodotto/${form.slug}`} target="_blank" rel="noreferrer">
            Vedi nel negozio
          </a>
        )}
      </AdminHead>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(form.status);
        }}
        noValidate
      >
        <section className="bp-panel" aria-labelledby={f("photos")}>
          <h2 id={f("photos")}>Foto</h2>
          <p>
            La prima è la copertina. JPG, PNG, WebP o AVIF fino a 10 MB, massimo {MAX_IMAGES}. Formato consigliato
            verticale 4:5.
          </p>
          <div className="bp-images">
            {form.images.map((src, i) => (
              <div className="bp-image-tile" key={src}>
                <img src={src} alt={`Foto ${i + 1} di ${form.name || "prodotto"}`} />
                {i === 0 && <span className="bp-cover">COPERTINA</span>}
                <div className="bp-tile-actions">
                  <button
                    type="button"
                    className="bp-icon-button"
                    onClick={() => moveImage(i, -1)}
                    disabled={i === 0}
                    aria-label={`Sposta la foto ${i + 1} a sinistra`}
                  >
                    <ArrowLeft size={13} aria-hidden="true" />
                  </button>
                  {i > 0 && (
                    <button
                      type="button"
                      className="bp-icon-button"
                      onClick={() => makeCover(i)}
                      aria-label={`Usa la foto ${i + 1} come copertina`}
                    >
                      <Star size={13} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="bp-icon-button"
                    onClick={() => dropImage(i)}
                    aria-label={`Rimuovi la foto ${i + 1}`}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="bp-icon-button"
                    onClick={() => moveImage(i, 1)}
                    disabled={i === form.images.length - 1}
                    aria-label={`Sposta la foto ${i + 1} a destra`}
                  >
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {form.images.length < MAX_IMAGES && (
              <label className="bp-upload-tile">
                {uploading > 0 ? (
                  <Loader2 size={20} className="bp-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus size={20} aria-hidden="true" />
                )}
                {uploading > 0 ? `Caricamento (${uploading})…` : "Aggiungi foto"}
                <input
                  aria-label="Aggiungi foto"
                  type="file"
                  accept={ACCEPTED.join(",")}
                  multiple
                  disabled={uploading > 0}
                  onChange={(e) => {
                    void upload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {uploadError && (
            <p className="bp-error" role="alert" style={{ marginTop: 12 }}>
              {uploadError}
            </p>
          )}
        </section>

        <section className="bp-panel" aria-labelledby={f("info")}>
          <h2 id={f("info")}>Scheda</h2>
          <p>Descrivi solo ciò che vendi: niente lavorazioni o installazione.</p>
          <div className="bp-form-grid">
            <label className="bp-field bp-span-4" htmlFor={f("name")}>
              <span>Nome *</span>
              <input aria-label="Nome"
                id={f("name")}
                className="bp-input"
                value={form.name}
                maxLength={140}
                required
                onChange={(e) => set("name", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-2" htmlFor={f("brand")}>
              <span>Marca</span>
              <input aria-label="Marca"
                id={f("brand")}
                className="bp-input"
                value={form.brand}
                maxLength={80}
                placeholder="es. BMW"
                onChange={(e) => set("brand", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-6" htmlFor={f("compat")}>
              <span>Compatibilità</span>
              <textarea aria-label="Compatibilità"
                id={f("compat")}
                className="bp-input"
                rows={2}
                maxLength={1000}
                value={form.compatibility}
                placeholder="Modelli e anni compatibili, es. Serie 3 G20 2019–2024"
                onChange={(e) => set("compatibility", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-6" htmlFor={f("desc")}>
              <span>Descrizione</span>
              <textarea aria-label="Descrizione"
                id={f("desc")}
                className="bp-input"
                rows={6}
                maxLength={6000}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-2" htmlFor={f("price")}>
              <span>Prezzo IVA inclusa (€) *</span>
              <input aria-label="Prezzo IVA inclusa (€)"
                id={f("price")}
                className="bp-input"
                inputMode="decimal"
                value={form.price}
                placeholder="249,00"
                aria-invalid={form.price.trim() !== "" && priceCents === null}
                onChange={(e) => set("price", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-2" htmlFor={f("stock")}>
              <span>Pezzi disponibili</span>
              <input aria-label="Pezzi disponibili"
                id={f("stock")}
                className="bp-input"
                type="number"
                min={0}
                max={10000}
                step={1}
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-2" htmlFor={f("condition")}>
              <span>Condizione</span>
              <select
                id={f("condition")}
                className="bp-input"
                value={form.condition}
                onChange={(e) => set("condition", e.target.value as FormState["condition"])}
              >
                <option value="nuovo">Nuovo</option>
                <option value="usato">Usato</option>
              </select>
            </label>
            <label className="bp-field bp-span-2" htmlFor={f("sku")}>
              <span>Codice interno (SKU)</span>
              <input aria-label="Codice interno (SKU)"
                id={f("sku")}
                className="bp-input"
                value={form.sku}
                maxLength={60}
                onChange={(e) => set("sku", e.target.value)}
              />
            </label>
            <label className="bp-field bp-span-4" htmlFor={f("slug")}>
              <span>Indirizzo pagina</span>
              <input aria-label="Indirizzo pagina"
                id={f("slug")}
                className="bp-input"
                value={form.slug}
                maxLength={90}
                placeholder="generato dal nome"
                onChange={(e) => set("slug", e.target.value)}
              />
              <small>/prodotto/{form.slug || "…"}</small>
            </label>
          </div>
        </section>

        <section className="bp-panel" aria-labelledby={f("cats")}>
          <h2 id={f("cats")}>Categorie e vetrina</h2>
          <p>Almeno una categoria per pubblicare.</p>
          {categories.isLoading ? (
            <AdminLoading />
          ) : categories.isError ? (
            <p className="bp-error">{errorMessage(categories.error)}</p>
          ) : !categories.data?.length ? (
            <p className="bp-error">
              Nessuna categoria. <Link to="/admin/categorie">Creane una</Link> prima di pubblicare.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 26px" }}>
              {categories.data.map((c) => (
                <label key={c.id} className="bp-check">
                  <input
                    aria-label={c.name}
                    type="checkbox"
                    checked={form.categoryIds.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                  />
                  {c.name}
                  {!c.visible && <small style={{ color: "var(--bp-muted)" }}>(nascosta)</small>}
                </label>
              ))}
            </div>
          )}
          <label className="bp-check" style={{ marginTop: 22 }}>
            <input aria-label="Mostra in home nella selezione" type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
            Mostra in home nella selezione
          </label>
        </section>

        <div className="bp-form-bar">
          <div>
            {error && (
              <p className="bp-error" role="alert">
                {error}
              </p>
            )}
            {saved && (
              <output className="bp-success">{saved}</output>
            )}
            {!error && !saved && uploading > 0 && <p className="bp-detail-bottom-note">Attendi la fine del caricamento.</p>}
          </div>
          <div className="bp-actions">
            {id && form.status !== "published" && (
              <button type="button" className="bp-button bp-button-danger bp-button-small" onClick={destroy} disabled={busy}>
                {remove.isPending ? <Loader2 size={14} className="bp-spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}
                Elimina
              </button>
            )}
            {id && form.status === "published" && (
              <button
                type="button"
                className="bp-button bp-button-outline bp-button-small"
                onClick={() => submit("archived")}
                disabled={busy}
              >
                Archivia
              </button>
            )}
            <button
              type="button"
              className="bp-button bp-button-outline bp-button-small"
              onClick={() => submit("draft")}
              disabled={busy}
            >
              {form.status === "published" ? "Riporta in bozza" : "Salva bozza"}
            </button>
            <button type="button" className="bp-button bp-button-small" onClick={() => submit("published")} disabled={busy}>
              {save.isPending && <Loader2 size={14} className="bp-spin" aria-hidden="true" />}
              {form.status === "published" ? "Salva e mantieni pubblicato" : "Pubblica"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
