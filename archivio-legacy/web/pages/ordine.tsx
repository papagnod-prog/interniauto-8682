import { useState } from "react";
import { Link } from "wouter";
import { Banknote, CreditCard, Landmark, MessageCircle, ShoppingBag } from "lucide-react";
import { formatEuro, useCart } from "../lib/cart";
import { useShopInfo } from "../queries/catalog";
import { useCreateOrder } from "../queries/orders";

type Payment = "carta" | "bonifico" | "contanti";
type Shipping = "ritiro" | "spedizione";

const PAYMENTS: { id: Payment; label: string; hint: string; icon: typeof CreditCard }[] = [
  { id: "carta", label: "Carta / Apple Pay", hint: "Link di pagamento sicuro Stripe nel messaggio", icon: CreditCard },
  { id: "bonifico", label: "Bonifico", hint: "Ricevi IBAN e causale su WhatsApp", icon: Landmark },
  { id: "contanti", label: "Contanti", hint: "Paghi al ritiro in officina", icon: Banknote },
];

function OrdinePage() {
  const { lines, subtotalCents, clear } = useCart();
  const shop = useShopInfo();
  const createOrder = useCreateOrder();

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    note: "",
  });
  const [shipping, setShipping] = useState<Shipping>("ritiro");
  const [payment, setPayment] = useState<Payment>("carta");
  const [result, setResult] = useState<{ whatsappUrl: string; code: string; paymentUrl: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shippingCents = shipping === "spedizione" ? shop.data?.shippingCents ?? 1500 : 0;
  const total = subtotalCents + shippingCents;
  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!lines.length) return;
    if (form.customerName.trim().length < 2 || form.phone.trim().length < 6) {
      setError("Inserisci nome e numero di telefono.");
      return;
    }
    if (shipping === "spedizione" && (!form.address.trim() || !form.city.trim())) {
      setError("Per la spedizione servono indirizzo e città.");
      return;
    }
    try {
      const res = await createOrder.mutateAsync({
        ...form,
        shipping,
        paymentMethod: payment,
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      });
      setResult({ whatsappUrl: res.whatsappUrl, code: res.code, paymentUrl: res.paymentUrl });
      window.open(res.whatsappUrl, "_blank");
      clear();
    } catch {
      setError("Non è stato possibile creare l'ordine. Riprova tra poco.");
    }
  };

  if (result) {
    return (
      <section className="container-ia py-24">
        <div className="mx-auto max-w-xl border border-line bg-surface p-10 text-center">
          <MessageCircle className="mx-auto size-10 text-wa" />
          <h1 className="mt-6 text-3xl">Ordine {result.code} pronto</h1>
          <p className="mt-4 text-muted">
            Si è aperta la chat WhatsApp con il riepilogo già scritto
            {result.paymentUrl ? " e il link di pagamento" : ""}. Premi invio per confermare
            l'ordine.
          </p>
          <a href={result.whatsappUrl} target="_blank" rel="noreferrer" className="btn-wa mt-8 w-full">
            Riapri il messaggio WhatsApp
          </a>
          {result.paymentUrl && (
            <a href={result.paymentUrl} target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full">
              Paga ora con carta
            </a>
          )}
          <Link to="/catalogo" className="mt-6 inline-block text-xs uppercase tracking-[0.18em] text-muted hover:text-leather">
            Torna al catalogo
          </Link>
        </div>
      </section>
    );
  }

  if (!lines.length) {
    return (
      <section className="container-ia py-32 text-center">
        <ShoppingBag className="mx-auto size-10 text-surface-2" />
        <h1 className="mt-6 text-4xl">Il carrello è vuoto</h1>
        <Link to="/catalogo" className="btn-primary mt-8">
          Vai al catalogo
        </Link>
      </section>
    );
  }

  return (
    <section className="container-ia py-16">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">
        Completa l'<span className="text-leather">ordine</span>
      </h1>

      <form onSubmit={submit} className="mt-12 grid gap-12 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <div>
            <p className="eyebrow">01 — I tuoi dati</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className="field"
                aria-label="Nome e cognome"
                placeholder="Nome e cognome *"
                value={form.customerName}
                onChange={(e) => update("customerName", e.target.value)}
              />
              <input
                className="field"
                aria-label="Telefono"
                placeholder="Telefono *"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <input
                className="field sm:col-span-2"
                aria-label="Email"
                placeholder="Email (facoltativa)"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="eyebrow">02 — Consegna</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["ritiro", "Ritiro in officina", shop.data?.address ?? "Corato (BA)"],
                  ["spedizione", "Spedizione", `+ ${formatEuro(shop.data?.shippingCents ?? 1500)}`],
                ] as const
              ).map(([id, label, hint]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setShipping(id)}
                  className={`border p-4 text-left transition-colors ${
                    shipping === id ? "border-leather bg-surface" : "border-line hover:border-surface-2"
                  }`}
                >
                  <p className="text-sm font-bold uppercase tracking-[0.12em]">{label}</p>
                  <p className="mt-1 text-xs text-muted">{hint}</p>
                </button>
              ))}
            </div>
            {shipping === "spedizione" && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  className="field sm:col-span-2"
                  aria-label="Indirizzo e numero civico"
                  placeholder="Indirizzo e numero civico *"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
                <input
                  className="field"
                  aria-label="Città e CAP"
                  placeholder="Città e CAP *"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">03 — Pagamento</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PAYMENTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPayment(p.id)}
                  className={`border p-4 text-left transition-colors ${
                    payment === p.id ? "border-leather bg-surface" : "border-line hover:border-surface-2"
                  }`}
                >
                  <p.icon className={`size-5 ${payment === p.id ? "text-leather" : "text-muted"}`} />
                  <p className="mt-3 text-sm font-bold uppercase tracking-[0.12em]">{p.label}</p>
                  <p className="mt-1 text-xs text-muted">{p.hint}</p>
                </button>
              ))}
            </div>
            {payment === "carta" && shop.data && !shop.data.stripeEnabled && (
              <p className="mt-3 text-xs text-leather">
                Stripe non è ancora collegato: il messaggio verrà inviato senza link di pagamento.
              </p>
            )}
          </div>

          <div>
            <p className="eyebrow">04 — Note per l'officina</p>
            <textarea
              className="field mt-4 min-h-28"
              aria-label="Note per l'officina"
              placeholder="Modello e anno del veicolo, colore cuciture, esigenze particolari…"
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
            />
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="sticky top-28 border border-line bg-surface p-6">
            <p className="eyebrow">Riepilogo</p>
            <div className="mt-5 space-y-4">
              {lines.map((l) => (
                <div key={l.productId} className="flex gap-3">
                  <div className="size-14 shrink-0 overflow-hidden bg-ink">
                    {l.image && <img src={l.image} alt="" className="size-full object-cover" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="leading-snug">{l.name}</p>
                    <p className="text-muted">
                      {l.qty} × {formatEuro(l.priceCents)}
                    </p>
                  </div>
                  <span className="text-sm text-leather">{formatEuro(l.priceCents * l.qty)}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotale</span>
                <span>{formatEuro(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Consegna</span>
                <span>{shippingCents ? formatEuro(shippingCents) : "Ritiro gratuito"}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm uppercase tracking-[0.14em]">Totale</span>
                <span className="font-display text-3xl text-leather">{formatEuro(total)}</span>
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-leather">{error}</p>}

            <button type="submit" disabled={createOrder.isPending} className="btn-wa mt-6 w-full disabled:opacity-60">
              <MessageCircle className="size-4" />
              {createOrder.isPending ? "Preparazione…" : "Invia ordine su WhatsApp"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted">
              Si apre WhatsApp con il riepilogo già compilato: controlla e premi invio.
            </p>
          </div>
        </aside>
      </form>
    </section>
  );
}

export default OrdinePage;
