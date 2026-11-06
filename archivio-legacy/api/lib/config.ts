/** Configurazione negozio: valori sovrascrivibili da .env */

export const shop = {
  name: "Interni Auto Design",
  /** Numero WhatsApp che riceve gli ordini (solo cifre, con prefisso internazionale) */
  whatsappOrders: (process.env.WHATSAPP_ORDERS_NUMBER ?? "393381464613").replace(/\D/g, ""),
  whatsappPublic: process.env.WHATSAPP_PUBLIC_NUMBER ?? "+39 345 49 58 428",
  phone: "+39 333 35 62 836",
  email: "info@interniautodesign.it",
  address: "Via Brindisi 26/28, 70033 Corato (BA)",
  vat: "07166400726",
  hours: ["Lunedì – Venerdì: 08:00–13:00 / 15:00–19:00", "Sabato: 08:00–13:00", "Domenica: chiuso"],
  shippingCents: 1500,
} as const;

export function siteUrl() {
  return process.env.WEBSITE_URL?.replace(/\/$/, "") ?? "http://localhost:4200";
}

export function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}
