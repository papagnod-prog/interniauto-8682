import { useMemo } from "react";
import { useSearch } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { ProductCard } from "../components/product-card";
import { useCategories, useProducts } from "../queries/catalog";

function CatalogoPage() {
  const search = useSearch();
  const active = useMemo(() => new URLSearchParams(search).get("categoria") ?? "", [search]);

  const categories = useCategories();
  const products = useProducts(active ? { category: active } : {});

  const select = (slug: string) => {
    navigate(slug ? `/catalogo?categoria=${slug}` : "/catalogo");
  };

  return (
    <>
      <section className="border-b border-line py-16 md:py-20">
        <div className="container-ia">
          <p className="eyebrow reveal">Catalogo</p>
          <h1 className="reveal delay-1 mt-4 text-[clamp(2.5rem,7vw,5rem)]">
            Articoli <span className="text-leather">disponibili</span>
          </h1>
          <p className="reveal delay-2 mt-5 max-w-2xl text-muted">
            Volanti, tappezzerie e pannelli pronti alla consegna. Prezzi IVA inclusa. Aggiungi al
            carrello e concludi l'ordine su WhatsApp con il link di pagamento.
          </p>
        </div>
      </section>

      <section className="container-ia py-12">
        <div className="mb-10 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => select("")}
            className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
              active === "" ? "border-leather bg-leather text-ink" : "border-line text-muted hover:border-leather hover:text-leather"
            }`}
          >
            Tutti
          </button>
          {categories.data?.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.slug)}
              className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                active === c.slug
                  ? "border-leather bg-leather text-ink"
                  : "border-line text-muted hover:border-leather hover:text-leather"
              }`}
            >
              {c.name} <span className="opacity-60">({c.count})</span>
            </button>
          ))}
        </div>

        {products.isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-4/5 animate-pulse bg-surface" />
            ))}
          </div>
        ) : products.data?.length ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.data.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted">
            Nessun articolo in questa categoria al momento.
          </p>
        )}
      </section>
    </>
  );
}

export default CatalogoPage;
