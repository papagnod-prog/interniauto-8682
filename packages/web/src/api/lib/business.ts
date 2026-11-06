/**
 * Dati della nuova attività (Antonio Vangi). Unica fonte per API e pagine.
 * CAP della sede e regime fiscale non ancora confermati dall'utente: non inventarli.
 */
export const ADMIN_EMAIL = "info@interniautodesign.it";

export const business = {
  brand: "Interni Auto — Luxury Boutique",
  owner: "Antonio Vangi",
  vatNumber: "09178390721",
  taxCode: "VNGNTN02R07C983O",
  address: "Via D. Morelli, 15",
  city: "Corato",
  email: "info@interniautodesign.it",
  phone: "+39 342 940 2109",
  phoneHref: "tel:+393429402109",
  whatsappAssistance: "+39 351 920 4546",
  whatsappHref: "https://wa.me/393519204546",
} as const;

/** URL pubblico del sito senza slash finale. */
export function siteUrl() {
  return (process.env.WEBSITE_URL ?? "http://localhost:4200").replace(/\/+$/, "");
}

/**
 * La vendita al pubblico resta chiusa finché i testi legali non sono approvati e
 * pubblicati (Fase 3). Cambiare solo dopo l'approvazione esplicita dell'utente.
 */
export const LEGAL_TERMS_PUBLISHED = false;
