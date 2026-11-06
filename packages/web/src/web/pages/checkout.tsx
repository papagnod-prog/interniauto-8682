import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { Breadcrumb, useDocumentTitle } from "../components/site-layout";
import { useCart } from "../lib/cart";
import { errorMessage, euro } from "../lib/format";
import { useCreateCheckout, useQuote } from "../queries/checkout";
import { SalesClosedNote, useCheckoutAccess } from "./cart";

type Address = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  province: string;
  note: string;
};

const EMPTY: Address = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  province: "",
  note: "",
};

function validate(a: Address) {
  const e: Partial<Record<keyof Address, string>> = {};
  if (a.name.trim().length < 3) e.name = "Inserisci nome e cognome";
  if (!/^\S+@\S+\.\S+$/.test(a.email.trim())) e.email = "Email non valida";
  if (!/^\+?[0-9 ./-]{6,20}$/.test(a.phone.trim())) e.phone = "Telefono non valido";
  if (a.addressLine1.trim().length < 4) e.addressLine1 = "Inserisci via e numero civico";
  if (!/^\d{5}$/.test(a.postalCode.trim())) e.postalCode = "CAP di 5 cifre";
  else if (/^4789\d$/.test(a.postalCode.trim()) || a.postalCode.trim() === "00120")
    e.postalCode = "San Marino e Vaticano non sono serviti";
  if (a.city.trim().length < 2) e.city = "Inserisci il comune";
  if (!/^[A-Za-z]{2}$/.test(a.province.trim())) e.province = "Sigla di 2 lettere (es. BA)";
  return e;
}

export default function CheckoutPage() {
  useDocumentTitle("Dati di spedizione");
  const cart = useCart();
  const quote = useQuote(cart.lines);
  const { info, allowed, testMode } = useCheckoutAccess();
  const create = useCreateCheckout();
  const [a, setA] = useState<Address>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  const q = quote.data;
  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setA((prev) => ({ ...prev, [k]: e.target.value }));

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate(a);
    setErrors(e);
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    create.mutate(
      {
        items: cart.lines,
        address: { ...a, province: a.province.toUpperCase(), country: "IT" },
      },
      { onSuccess: (r) => window.location.assign(r.url) },
    );
  };

  const field = (k: keyof Address, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, span = "bp-span-6") => (
    <label className={`bp-field ${span}`} htmlFor={`f-${k}`}>
      <span>{label}</span>
      <input
        id={`f-${k}`}
        className="bp-input"
        value={a[k]}
        onChange={set(k)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `e-${k}` : undefined}
        {...props}
      />
      {errors[k] && (
        <small id={`e-${k}`} className="bp-error">
          {errors[k]}
        </small>
      )}
    </label>
  );

  if (info.isLoading || quote.isLoading) {
    return (
      <div className="bp-loading">
        <Loader2 className="bp-spin" aria-label="Caricamento" />
      </div>
    );
  }

  return (
    <section className="bp-container bp-page">
      <Breadcrumb items={[{ label: "La boutique", to: "/" }, { label: "Carrello", to: "/carrello" }, { label: "Spedizione" }]} />
      <div className="bp-page-head">
        <p className="bp-eyebrow">ORDINE · SPEDIZIONE IN ITALIA {testMode && <span className="bp-test-badge">TEST</span>}</p>
        <h1>
          Dove <em>spediamo?</em>
        </h1>
      </div>

      {!allowed || !q || !q.ok || cart.lines.length === 0 ? (
        <div style={{ maxWidth: 640, display: "grid", gap: 20 }}>
          <SalesClosedNote />
          {cart.lines.length === 0 && <p className="bp-detail-description">Il carrello è vuoto.</p>}
          {q && !q.ok && cart.lines.length > 0 && (
            <p className="bp-error">Il carrello va aggiornato prima di procedere (disponibilità o spedizione).</p>
          )}
          <Link to="/carrello" className="bp-text-link">
            <ArrowLeft size={17} aria-hidden="true" /> Torna al carrello
          </Link>
        </div>
      ) : (
        <form className="bp-cart-layout" onSubmit={submit} noValidate>
          <div>
            <fieldset className="bp-fieldset">
              <legend>Contatti</legend>
              <div className="bp-form-grid">
                {field("name", "Nome e cognome", { autoComplete: "name", maxLength: 120 })}
                {field("email", "Email", { type: "email", autoComplete: "email", maxLength: 200 }, "bp-span-3")}
                {field("phone", "Telefono (per il corriere)", { type: "tel", autoComplete: "tel", maxLength: 20 }, "bp-span-3")}
              </div>
            </fieldset>
            <fieldset className="bp-fieldset">
              <legend>Indirizzo di consegna</legend>
              <div className="bp-form-grid">
                {field("addressLine1", "Via e numero civico", { autoComplete: "address-line1", maxLength: 160 })}
                {field("addressLine2", "Scala, interno, presso (facoltativo)", { autoComplete: "address-line2", maxLength: 160 })}
                {field("postalCode", "CAP", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 5 }, "bp-span-2")}
                {field("city", "Comune", { autoComplete: "address-level2", maxLength: 80 }, "bp-span-3")}
                {field("province", "Provincia", { autoComplete: "address-level1", maxLength: 2, style: { textTransform: "uppercase" } }, "bp-span-1")}
                <div className="bp-field bp-span-6">
                  <span>Paese</span>
                  <p className="bp-input" aria-readonly="true" style={{ color: "var(--bp-muted)" }}>
                    Italia — spediamo solo sul territorio italiano
                  </p>
                </div>
                <label className="bp-field bp-span-6" htmlFor="f-note">
                  <span>Note per la consegna (facoltative)</span>
                  <textarea aria-label="Note per la consegna (facoltative)" id="f-note" className="bp-input" value={a.note} onChange={set("note")} maxLength={500} />
                </label>
              </div>
            </fieldset>
          </div>
          <aside className="bp-summary" aria-label="Riepilogo ordine">
            <h2>Il tuo ordine</h2>
            <div className="bp-summary-lines">
              {q.lines.map((l) => (
                <div key={l.productId}>
                  <span>
                    {l.qty} × {l.name}
                  </span>
                  <span>{euro(l.unitCents * l.qty)}</span>
                </div>
              ))}
            </div>
            <dl>
              <div>
                <dt>Subtotale</dt>
                <dd>{euro(q.subtotalCents)}</dd>
              </div>
              <div>
                <dt>Spedizione</dt>
                <dd>{q.shippingCents === 0 ? "Gratuita" : euro(q.shippingCents ?? 0)}</dd>
              </div>
              <div className="bp-total">
                <dt>Totale</dt>
                <dd>{euro(q.totalCents ?? 0)}</dd>
              </div>
            </dl>
            <SalesClosedNote />
            {create.isError && (
              <p className="bp-error" role="alert" style={{ marginBottom: 14 }}>
                {errorMessage(create.error)}
              </p>
            )}
            <button type="submit" className="bp-button bp-button-block" disabled={create.isPending || create.isSuccess}>
              {create.isPending || create.isSuccess ? (
                <Loader2 size={17} className="bp-spin" aria-hidden="true" />
              ) : (
                <Lock size={16} aria-hidden="true" />
              )}
              {create.isSuccess ? "Apertura di Stripe…" : "Paga con carta su Stripe"}
            </button>
            <p className="bp-detail-bottom-note">
              Verrai reindirizzato alla pagina di pagamento Stripe. Gli articoli restano riservati per 30 minuti.
            </p>
          </aside>
        </form>
      )}
    </section>
  );
}
