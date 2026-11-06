import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** Il carrello salva solo id e quantità: prezzi e disponibilità arrivano sempre dal server. */
export type CartLine = { productId: number; qty: number };

const KEY = "ia-cart-v2";
export const MAX_QTY = 10;

type CartValue = {
  lines: CartLine[];
  count: number;
  add: (productId: number, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((l) => Number.isInteger(l?.productId) && Number.isInteger(l?.qty) && l.qty > 0)
      .slice(0, 30)
      .map((l) => ({ productId: l.productId, qty: Math.min(l.qty, MAX_QTY) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage non disponibile */
    }
  }, [lines]);

  useEffect(() => {
    const sync = (e: StorageEvent) => e.key === KEY && setLines(load());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const setQty = useCallback((productId: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)),
    );
  }, []);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      add: (productId, qty = 1) =>
        setLines((prev) => {
          const hit = prev.find((l) => l.productId === productId);
          if (hit) {
            return prev.map((l) =>
              l.productId === productId ? { ...l, qty: Math.min(l.qty + qty, MAX_QTY) } : l,
            );
          }
          return [...prev, { productId, qty: Math.min(qty, MAX_QTY) }].slice(0, 30);
        }),
      setQty,
      remove: (productId) => setLines((prev) => prev.filter((l) => l.productId !== productId)),
      clear: () => setLines([]),
    }),
    [lines, setQty],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fuori da CartProvider");
  return ctx;
}
