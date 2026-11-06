import { Link } from "wouter";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { formatEuro, useCart } from "../lib/cart";

export function CartDrawer() {
  const { open, setOpen, lines, setQty, remove, subtotalCents, count } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button
        type="button"
        aria-label="Chiudi carrello"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-ink-deep/80 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-[420px] flex-col border-l border-line bg-ink">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <span className="font-display text-2xl">
            Carrello <span className="text-leather">({count})</span>
          </span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Chiudi">
            <X className="size-5 text-muted hover:text-stitch" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="size-10 text-surface-2" />
            <p className="text-sm text-muted">Il carrello è vuoto.</p>
            <Link to="/catalogo" onClick={() => setOpen(false)} className="btn-ghost">
              Vai al catalogo
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {lines.map((line) => (
                <div key={line.productId} className="flex gap-4 border-b border-line py-4 last:border-0">
                  <div className="size-20 shrink-0 overflow-hidden bg-surface">
                    {line.image && (
                      <img src={line.image} alt={line.name} className="size-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-snug">{line.name}</p>
                    <p className="mt-1 text-sm text-leather">{formatEuro(line.priceCents)}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center border border-line">
                        <button
                          type="button"
                          className="px-2 py-1 text-muted hover:text-stitch"
                          onClick={() => setQty(line.productId, line.qty - 1)}
                          aria-label="Riduci"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{line.qty}</span>
                        <button
                          type="button"
                          className="px-2 py-1 text-muted hover:text-stitch"
                          onClick={() => setQty(line.productId, line.qty + 1)}
                          aria-label="Aumenta"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.productId)}
                        className="text-muted hover:text-leather"
                        aria-label="Rimuovi"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Subtotale (IVA inclusa)</span>
                <span className="font-display text-2xl text-leather">{formatEuro(subtotalCents)}</span>
              </div>
              <Link to="/ordine" onClick={() => setOpen(false)} className="btn-primary mt-4 w-full">
                Completa l'ordine
              </Link>
              <p className="mt-3 text-center text-[11px] text-muted">
                L'ordine viene inviato su WhatsApp con il link di pagamento
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
