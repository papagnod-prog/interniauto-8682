const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export const euro = (cents: number) => eur.format(cents / 100);

export const dateTime = (d: Date | string | number | null | undefined) =>
  d
    ? new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(d))
    : "—";

export function errorMessage(err: unknown, fallback = "Qualcosa è andato storto. Riprova.") {
  const issues = (err as { data?: { issues?: { message?: string; path?: unknown[] }[] } })?.data?.issues;
  if (Array.isArray(issues) && issues.length) {
    return issues
      .map((i) => i.message)
      .filter(Boolean)
      .slice(0, 3)
      .join(" · ");
  }
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return fallback;
}

export const ORDER_STATUS: Record<string, string> = {
  pending_payment: "In attesa di pagamento",
  paid: "Pagato",
  shipped: "Spedito",
  delivered: "Consegnato",
  expired: "Scaduto",
  canceled: "Annullato",
  review: "Da verificare",
};
