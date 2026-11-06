import { useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Check, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { formatEuro, useCart } from "../lib/cart";
import { useProduct, useShopInfo } from "../queries/catalog";

function ProdottoPage() {
  const { slug } = useParams<{ slug: string }>();
  const query = useProduct(slug);
  const shop = useShopInfo();
  const { add, setOpen } = useCart();
  const [imgIndex, setImgIndex] = useState(0);
  const [added, setAdded] = useState(false);

  if (query.isLoading) {
    return (
      <div className="container-ia grid gap-10 py-20 lg:grid-cols-2">
        <div className="aspect-4/5 animate-pulse bg-surface" />
        <div className="space-y-4">
          <div className="h-10 w-2/3 animate-pulse bg-surface" />
          <div className="h-6 w-1/3 animate-pulse bg-surface" />
          <div className="h-32 animate-pulse bg-surface" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="container-ia py-32 text-center">
        <h1 className="text-4xl">Articolo non trovato</h1>
        <Link to="/catalogo" className="btn-primary mt-8">
          Torna al catalogo
        </Link>
      </div>
    );
  }

  const { product, related } = query.data;
  const cover = product.images[imgIndex] ?? product.images[0] ?? null;
  const wa = shop.data?.whatsappOrders ?? "393381464613";
  const waText = encodeURIComponent(
    `Ciao! Sono interessato a: ${product.name} (${formatEuro(product.priceCents)}). È disponibile?`,
  );

  const addToCart = () => {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: product.priceCents,
      image: product.images[0] ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className="container-ia pt-8">
        <Link to="/catalogo" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted hover:text-leather">
          <ArrowLeft className="size-4" /> Catalogo
        </Link>
      </div>

      <section className="container-ia grid gap-12 py-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="reveal aspect-4/3 overflow-hidden bg-surface">
            {cover && <img src={cover} alt={product.name} className="size-full object-cover" />}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  aria-label={`Foto ${i + 1} di ${product.name}`}
                  onClick={() => setImgIndex(i)}
                  className={`aspect-square overflow-hidden border transition-colors ${
                    i === imgIndex ? "border-leather" : "border-line hover:border-surface-2"
                  }`}
                >
                  <img src={img} alt="" className="size-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <p className="eyebrow">{product.categories.map((c) => c.name).join(" · ") || "Catalogo"}</p>
          <h1 className="reveal mt-3 text-[clamp(2rem,4.5vw,3.2rem)]">{product.name}</h1>
          <p className="reveal delay-1 mt-4 font-display text-4xl text-leather">
            {formatEuro(product.priceCents)}
          </p>
          <p className="text-xs text-muted">IVA inclusa</p>

          {product.description && (
            <p className="reveal delay-2 mt-6 whitespace-pre-line text-muted">{product.description}</p>
          )}

          <div className="reveal delay-3 mt-8 flex flex-col gap-3">
            <button type="button" onClick={addToCart} className="btn-primary w-full">
              {added ? (
                <>
                  <Check className="size-4" /> Aggiunto al carrello
                </>
              ) : (
                "Aggiungi al carrello"
              )}
            </button>
            <button type="button" onClick={() => setOpen(true)} className="btn-ghost w-full">
              Vai al carrello
            </button>
            <a
              href={`https://wa.me/${wa}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="btn-wa w-full"
            >
              <MessageCircle className="size-4" /> Chiedi informazioni
            </a>
          </div>

          <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm text-muted">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-leather" /> Lavorazione artigianale, garanzia
              sull'installazione in officina
            </li>
            <li className="flex items-center gap-3">
              <Truck className="size-4 text-leather" /> Ritiro a Corato (BA) o spedizione in tutta
              Italia
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle className="size-4 text-leather" /> Ordine e pagamento gestiti via
              WhatsApp
            </li>
          </ul>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container-ia border-t border-line py-16">
          <h2 className="mb-10 text-3xl">Ti potrebbe interessare</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default ProdottoPage;
