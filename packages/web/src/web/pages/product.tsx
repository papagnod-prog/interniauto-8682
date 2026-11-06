import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Check, Loader2, MessageCircle, Minus, Plus, ShoppingBag } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { Breadcrumb, useDocumentTitle, WHATSAPP_HREF } from "../components/site-layout";
import { MAX_QTY, useCart } from "../lib/cart";
import { euro } from "../lib/format";
import { useProduct, useShopInfo } from "../queries/shop";
import NotFoundPage from "./not-found";

export default function ProductPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const query = useProduct(slug);
  const info = useShopInfo();
  const cart = useCart();
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  useDocumentTitle(query.data?.product.name ?? "Prodotto");
  useEffect(() => {
    setPhoto(0);
    setQty(1);
    setAdded(false);
  }, [slug]);

  if (query.isLoading) {
    return (
      <div className="bp-loading" aria-busy="true">
        <Loader2 className="bp-spin" aria-label="Caricamento" />
      </div>
    );
  }
  const status = (query.error as { status?: number } | null)?.status;
  if (query.isError && status !== 404) {
    return (
      <section className="bp-container bp-not-found">
        <p className="bp-error" role="alert">
          Impossibile caricare la scheda. Ricarica la pagina.
        </p>
      </section>
    );
  }
  if (!query.data) return <NotFoundPage what="scheda" />;
  const { product, related } = query.data;
  const photos = product.images;
  const inCart = cart.lines.find((l) => l.productId === product.id)?.qty ?? 0;
  const maxQty = Math.min(MAX_QTY, product.lowStock ?? MAX_QTY) - inCart;
  const shipping = info.data?.shipping;
  const category = product.categories[0];

  return (
    <>
      <section className="bp-container bp-detail">
        <Breadcrumb
          items={[
            { label: "La boutique", to: "/" },
            { label: "Il catalogo", to: "/catalogo" },
            ...(category ? [{ label: category.name, to: `/catalogo?categoria=${category.slug}` }] : []),
            { label: product.name },
          ]}
        />
        <div className="bp-detail-grid">
          <div className="bp-gallery">
            <div className="bp-detail-picture is-photo">
              {photos[photo] && <img src={photos[photo]} alt={`${product.name} — foto ${photo + 1} di ${photos.length}`} />}
              {photos.length > 1 && (
                <span className="bp-photo-counter">
                  {String(photo + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
                </span>
              )}
            </div>
            {photos.length > 1 && (
              <div className="bp-thumbnails" aria-label="Fotografie del prodotto">
                {photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    className={photo === i ? "is-active" : ""}
                    aria-label={`Mostra foto ${i + 1}`}
                    aria-pressed={photo === i}
                    onClick={() => setPhoto(i)}
                  >
                    <img src={src} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="bp-detail-copy">
            <p className="bp-eyebrow">{[category?.name, product.brand].filter(Boolean).join(" / ")}</p>
            <h1>{product.name}</h1>
            <div className="bp-detail-price">
              {euro(product.priceCents)}
              <span>Prezzo finale · spedizione calcolata nel carrello</span>
            </div>
            {product.description && <p className="bp-detail-description">{product.description}</p>}
            <dl className="bp-specifications">
              {product.brand && (
                <div>
                  <dt>Marca</dt>
                  <dd>{product.brand}</dd>
                </div>
              )}
              {product.compatibility && (
                <div>
                  <dt>Compatibilità</dt>
                  <dd style={{ whiteSpace: "pre-line" }}>{product.compatibility}</dd>
                </div>
              )}
              <div>
                <dt>Condizione</dt>
                <dd>{product.condition === "usato" ? "Usato" : "Nuovo"}</dd>
              </div>
              <div>
                <dt>Disponibilità</dt>
                <dd>
                  {!product.inStock
                    ? "Esaurito"
                    : product.lowStock
                      ? `Ultimi ${product.lowStock} ${product.lowStock === 1 ? "pezzo" : "pezzi"}`
                      : "Disponibile"}
                </dd>
              </div>
              <div>
                <dt>Spedizione</dt>
                <dd>
                  Solo Italia
                  {shipping ? ` · ${shipping.deliveryTime}` : ""}
                </dd>
              </div>
            </dl>
            {product.inStock ? (
              <div className="bp-buy">
                <fieldset className="bp-qty" aria-label="Quantità">
                  <button type="button" aria-label="Diminuisci" disabled={qty <= 1} onClick={() => setQty((v) => v - 1)}>
                    <Minus size={14} />
                  </button>
                  <output aria-live="polite">{qty}</output>
                  <button type="button" aria-label="Aumenta" disabled={qty >= maxQty} onClick={() => setQty((v) => v + 1)}>
                    <Plus size={14} />
                  </button>
                </fieldset>
                <button
                  type="button"
                  className="bp-button"
                  disabled={maxQty <= 0}
                  onClick={() => {
                    cart.add(product.id, qty);
                    setAdded(true);
                  }}
                >
                  <ShoppingBag size={17} aria-hidden="true" />
                  {maxQty <= 0 ? "Quantità massima nel carrello" : "Aggiungi al carrello"}
                </button>
              </div>
            ) : (
              <button type="button" className="bp-button bp-button-block" disabled>
                Esaurito
              </button>
            )}
            {added && (
              <output className="bp-success" style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                <Check size={15} aria-hidden="true" /> Aggiunto al carrello.{" "}
                <Link to="/carrello" className="bp-text-link" style={{ paddingBottom: 2, gap: 8 }}>
                  Vai al carrello
                </Link>
              </output>
            )}
            {info.data && !info.data.salesOpen && (
              <p className="bp-detail-bottom-note">Le vendite online non sono ancora attive: il pagamento sarà disponibile a breve.</p>
            )}
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="bp-detail-assistance">
              <MessageCircle size={17} aria-hidden="true" />
              Dubbi sulla compatibilità? Contatta l'assistenza
            </a>
          </div>
        </div>
        <Link className="bp-text-link bp-return" to="/catalogo">
          <ArrowLeft size={17} aria-hidden="true" /> Torna al catalogo
        </Link>
      </section>
      {related.length > 0 && (
        <section className="bp-container bp-related">
          <div className="bp-section-heading">
            <div>
              <p className="bp-eyebrow">ALTRE PROSPETTIVE</p>
              <h2>
                Continua <em>a esplorare.</em>
              </h2>
            </div>
          </div>
          <div className="bp-product-grid">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
