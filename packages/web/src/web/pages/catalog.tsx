import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { ProductCard, ProductGridSkeleton } from "../components/product-card";
import { Breadcrumb, useDocumentTitle, WHATSAPP_HREF } from "../components/site-layout";
import { useCategories, useProducts } from "../queries/shop";

type Sort = "recenti" | "prezzo-asc" | "prezzo-desc";

export default function CatalogPage() {
  useDocumentTitle("Il catalogo");
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);
  const category = params.get("categoria") ?? "";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(q);
  const [sort, setSort] = useState<Sort>("recenti");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const categories = useCategories();
  const products = useProducts({ category: category || undefined, q: debounced || undefined, sort });
  const all = useProducts({});
  const total = all.data?.length ?? 0;

  const setCategory = (slug: string) => navigate(slug ? `/catalogo?categoria=${slug}` : "/catalogo");
  const items = products.data ?? [];
  const filtering = !!category || !!debounced;

  return (
    <section className="bp-container bp-catalog">
      <Breadcrumb items={[{ label: "La boutique", to: "/" }, { label: "Il catalogo" }]} />
      <div className="bp-section-heading">
        <div>
          <p className="bp-eyebrow">LA SELEZIONE INTERNI AUTO</p>
          <h1>
            Ogni dettaglio,
            <br />
            <em>una possibilità.</em>
          </h1>
        </div>
        <p className="bp-catalog-intro">
          Volanti e tappezzerie plurimarche.
          <br />
          Ogni articolo con foto reali, condizione e compatibilità.
        </p>
      </div>

      {total > 0 && (
        <div className="bp-catalog-controls">
          <div className="bp-filters" aria-label="Categorie">
            <button type="button" onClick={() => setCategory("")} aria-pressed={!category} className={!category ? "is-active" : ""}>
              Tutti <span>{String(total).padStart(2, "0")}</span>
            </button>
            {categories.data
              ?.filter((c) => c.count > 0)
              .map((c) => (
                <button
                  type="button"
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  aria-pressed={category === c.slug}
                  className={category === c.slug ? "is-active" : ""}
                >
                  {c.name} <span>{String(c.count).padStart(2, "0")}</span>
                </button>
              ))}
          </div>
          <div className="bp-catalog-tools">
            <label className="bp-search">
              <Search size={16} aria-hidden="true" />
              <input
                aria-label="Cerca per marca, modello o compatibilità"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cerca marca o modello"
                type="search"
                maxLength={80}
              />
            </label>
            <label className="bp-sort">
              <select aria-label="Ordina" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option value="recenti">Più recenti</option>
                <option value="prezzo-asc">Prezzo crescente</option>
                <option value="prezzo-desc">Prezzo decrescente</option>
              </select>
              <ChevronDown size={13} aria-hidden="true" />
            </label>
          </div>
        </div>
      )}

      {products.isLoading || all.isLoading ? (
        <div style={{ marginTop: 32 }}>
          <ProductGridSkeleton count={6} />
        </div>
      ) : products.isError ? (
        <p className="bp-error" role="alert" style={{ marginTop: 32 }}>
          Impossibile caricare il catalogo. Ricarica la pagina.
        </p>
      ) : total === 0 ? (
        <div className="bp-empty-panel" style={{ marginTop: 8 }}>
          <h2>
            Il catalogo
            <br />
            <em>è in allestimento.</em>
          </h2>
          <div>
            <p>
              I primi articoli saranno pubblicati a breve, ciascuno con fotografie reali,
              condizione e compatibilità. Cerchi un modello preciso? Chiedi all'assistenza.
            </p>
            <div className="bp-actions">
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="bp-button bp-button-outline">
                Scrivici su WhatsApp <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="bp-results" aria-live="polite">
            {items.length} {items.length === 1 ? "articolo" : "articoli"}
          </p>
          {items.length ? (
            <div className="bp-product-grid">
              {items.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          ) : (
            <div className="bp-empty">
              <Search size={30} aria-hidden="true" />
              <h2>Nessun articolo trovato</h2>
              <p>Prova un'altra marca o modifica i filtri.</p>
              {filtering && (
                <button
                  type="button"
                  className="bp-text-link"
                  onClick={() => {
                    setQ("");
                    setCategory("");
                  }}
                >
                  Mostra tutto <ArrowRight size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
