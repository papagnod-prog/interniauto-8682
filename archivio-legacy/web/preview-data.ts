/** Dati solo dimostrativi: non importare nelle API commerciali o nel carrello. */
export const previewProducts = [
  {
    id: "cupra",
    name: "Volante Cupra",
    subtitle: "Formentor / Leon",
    category: "Volanti",
    brand: "Cupra",
    price: 180,
    image: "/images/boutique/demo-volante-cupra.webp",
    original: "/images/products/volante-seat-cupra-formentor-leon-1.jpeg",
    other: "/images/products/volante-seat-cupra-formentor-leon-2.jpeg",
    text: "Un esempio di scheda per un volante sportivo con comandi. Qui troverai fotografie, caratteristiche e compatibilità del prodotto reale, quando verrà pubblicato.",
  },
  {
    id: "fiat",
    name: "Volante Fiat",
    subtitle: "500E / Abarth",
    category: "Volanti",
    brand: "Fiat",
    price: 200,
    image: "/images/boutique/demo-volante-fiat.webp",
    original: "/images/products/volante-fiat-500e-abarth-1.jpeg",
    other: "/images/products/volante-fiat-500e-abarth-2.jpeg",
    text: "Esempio di presentazione di un volante plurimarche. Le specifiche definitive, la condizione e la disponibilità verranno compilate nella dashboard.",
  },
  {
    id: "ds3",
    name: "Tappezzeria DS",
    subtitle: "DS3 Crossback",
    category: "Tappezzerie",
    brand: "DS",
    price: 650,
    image: "/images/boutique/demo-tappezzeria.webp",
    original: "/images/products/tappezzeria-ds3-crossback-1.jpeg",
    other: "/images/products/tappezzeria-ds3-crossback-2.jpeg",
    text: "Esempio di una tappezzeria completa. Fotografie e prezzo servono esclusivamente a valutare la grafica: questo articolo non è in vendita.",
  },
] as const;

export type PreviewProduct = (typeof previewProducts)[number];

export function demoPrice(price: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
}
