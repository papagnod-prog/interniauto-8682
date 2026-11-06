import { Link } from "wouter";
import { Plus } from "lucide-react";
import { formatEuro, useCart } from "../lib/cart";

type Product = {
  id: number;
  slug: string;
  name: string;
  priceCents: number;
  images: string[];
  categories: { slug: string; name: string }[];
};

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const cover = product.images[0] ?? null;
  const hover = product.images[1] ?? cover;

  return (
    <article
      className={`group reveal delay-${Math.min(index + 1, 6)}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Link to={`/prodotti/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden bg-surface">
          {cover && (
            <img
              src={cover}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
          )}
          {hover && hover !== cover && (
            <img
              src={hover}
              alt=""
              loading="lazy"
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          <span className="absolute left-0 top-0 bg-ink/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-leather">
            {product.categories[0]?.name ?? "Catalogo"}
          </span>
        </div>
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <Link to={`/prodotti/${product.slug}`}>
            <h3 className="text-[15px] leading-tight transition-colors group-hover:text-leather">
              {product.name}
            </h3>
          </Link>
          <p className="mt-1 text-sm text-leather">{formatEuro(product.priceCents)}</p>
        </div>
        <button
          type="button"
          aria-label={`Aggiungi ${product.name} al carrello`}
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              image: cover,
            })
          }
          className="flex size-9 shrink-0 items-center justify-center border border-line transition-colors hover:border-leather hover:text-leather"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </article>
  );
}
