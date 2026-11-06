import { Link } from "wouter";
import { ArrowRight, ImageOff } from "lucide-react";
import { euro } from "../lib/format";

export type CardProduct = {
  slug: string;
  name: string;
  brand: string;
  compatibility: string;
  priceCents: number;
  images: string[];
  inStock: boolean;
  lowStock: number | null;
  categories: { slug: string; name: string }[];
};

export function ProductCard({ product, index }: { product: CardProduct; index: number }) {
  const href = `/prodotto/${product.slug}`;
  const cover = product.images[0];
  const label = [product.categories[0]?.name, product.brand].filter(Boolean).join(" / ");
  return (
    <article className="bp-product-card">
      <Link to={href} className="bp-product-picture is-photo" aria-label={`Visualizza ${product.name}`}>
        {!product.inStock ? (
          <span className="bp-stock-chip">ESAURITO</span>
        ) : product.lowStock ? (
          <span className="bp-stock-chip">ULTIMI {product.lowStock} PEZZI</span>
        ) : null}
        {cover ? (
          <img src={cover} alt={product.name} loading="lazy" />
        ) : (
          <span className="bp-loading">
            <ImageOff size={22} aria-hidden="true" />
          </span>
        )}
        <span className="bp-image-number">{String(index + 1).padStart(2, "0")}</span>
        <span className="bp-card-arrow">
          <ArrowRight size={21} aria-hidden="true" />
        </span>
      </Link>
      <div className="bp-product-info">
        <div>
          {label && <p className="bp-eyebrow">{label}</p>}
          <h3>
            <Link to={href}>{product.name}</Link>
          </h3>
          {product.compatibility && <p className="bp-product-model">{product.compatibility.split("\n")[0]}</p>}
        </div>
        <div className="bp-product-price">
          <strong>{euro(product.priceCents)}</strong>
          <span>Prezzo finale</span>
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="bp-product-grid" aria-busy="true" aria-label="Caricamento prodotti">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="bp-product-picture bp-skeleton" />
          <div className="bp-skeleton" style={{ height: 22, marginTop: 20, width: "60%" }} />
        </div>
      ))}
    </div>
  );
}
