import { useEffect } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowRight, FlaskConical, Info, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Breadcrumb, useDocumentTitle } from "../components/site-layout";
import { MAX_QTY, useCart } from "../lib/cart";
import { euro } from "../lib/format";
import { useQuote } from "../queries/checkout";
import { useShopInfo } from "../queries/shop";

export function useCheckoutAccess() {
  const info = useShopInfo();
  const d = info.data;
  const allowed = !!d && (d.salesOpen || (d.viewerIsAdmin && d.testCheckoutReady));
  return { info, allowed, testMode: !!d && !d.salesOpen && d.viewerIsAdmin };
}

export function SalesClosedNote() {
  const { info, testMode } = useCheckoutAccess();
  if (!info.data || info.data.salesOpen) return null;
  if (testMode) {
    return (
      <div className="bp-callout is-test">
        <FlaskConical size={16} aria-hidden="true" />
        <p>
          <span className="bp-test-badge">TEST</span>{" "}
          {info.data.testCheckoutReady ? (
            <>Sei collegato come amministratore: il pagamento usa Stripe in modalità di prova, nessun addebito reale.</>
          ) : (
            <>
              Checkout di prova non pronto: configura chiave Stripe test e spedizione in{" "}
              <Link to="/admin/impostazioni" style={{ textDecoration: "underline" }}>
                Impostazioni
              </Link>
              .
            </>
          )}
        </p>
      </div>
    );
  }
  return (
    <div className="bp-callout">
      <Info size={16} aria-hidden="true" />
      <p>
        <strong>Le vendite online non sono ancora attive.</strong> Puoi preparare il carrello: il
        pagamento con carta sarà disponibile all'apertura del negozio.
      </p>
    </div>
  );
}

export default function CartPage() {
  useDocumentTitle("Carrello");
  const cart = useCart();
  const quote = useQuote(cart.lines);
  const { allowed } = useCheckoutAccess();

  // Rimuove dal carrello gli articoli non più pubblicati.
  useEffect(() => {
    quote.data?.missing.forEach((id) => cart.remove(id));
  }, [quote.data?.missing]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = quote.data;
  const hasProblem = q?.lines.some((l) => l.problem);

  return (
    <section className="bp-container bp-page">
      <Breadcrumb items={[{ label: "La boutique", to: "/" }, { label: "Carrello" }]} />
      <div className="bp-page-head">
        <p className="bp-eyebrow">IL TUO CARRELLO</p>
        <h1>
          La tua <em>selezione.</em>
        </h1>
      </div>

      {cart.lines.length === 0 ? (
        <div className="bp-empty-panel">
          <h2>
            Il carrello
            <br />
            <em>è vuoto.</em>
          </h2>
          <div>
            <p>Sfoglia il catalogo di volanti e tappezzerie plurimarche.</p>
            <div className="bp-actions">
              <Link to="/catalogo" className="bp-button">
                Vai al catalogo <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      ) : quote.isLoading ? (
        <div className="bp-loading">
          <Loader2 className="bp-spin" aria-label="Caricamento carrello" />
        </div>
      ) : quote.isError || !q ? (
        <p className="bp-error" role="alert">
          Impossibile aggiornare il carrello. Ricarica la pagina.
        </p>
      ) : (
        <div className="bp-cart-layout">
          <div>
            <div className="bp-cart-lines">
              {q.lines.map((l) => {
                const max = Math.min(MAX_QTY, Math.max(l.available, 1));
                return (
                  <div className="bp-cart-line" key={l.productId}>
                    {l.image ? <img src={l.image} alt="" /> : <span className="bp-cart-thumb" />}
                    <div>
                      <h3>
                        <Link to={`/prodotto/${l.slug}`}>{l.name}</Link>
                      </h3>
                      <p className="bp-line-meta">{euro(l.unitCents)} cad.</p>
                      {l.problem && (
                        <p className="bp-error" style={{ marginTop: 6 }}>
                          <AlertTriangle size={13} aria-hidden="true" style={{ display: "inline", marginRight: 5 }} />
                          {l.problem === "unavailable"
                            ? "Non più disponibile: rimuovilo per continuare."
                            : `Disponibili solo ${l.available} pezzi.`}
                        </p>
                      )}
                    </div>
                    <div className="bp-line-side">
                      <fieldset className="bp-qty" aria-label={`Quantità di ${l.name}`}>
                        <button type="button" aria-label="Diminuisci" disabled={l.qty <= 1} onClick={() => cart.setQty(l.productId, l.qty - 1)}>
                          <Minus size={14} />
                        </button>
                        <output>{l.qty}</output>
                        <button type="button" aria-label="Aumenta" disabled={l.qty >= max} onClick={() => cart.setQty(l.productId, l.qty + 1)}>
                          <Plus size={14} />
                        </button>
                      </fieldset>
                      <strong>{euro(l.unitCents * l.qty)}</strong>
                      <button type="button" className="bp-link-button" onClick={() => cart.remove(l.productId)}>
                        Rimuovi
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/catalogo" className="bp-text-link" style={{ marginTop: 28 }}>
              Continua lo shopping <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <aside className="bp-summary" aria-label="Riepilogo">
            <h2>Riepilogo</h2>
            <dl>
              <div>
                <dt>Subtotale</dt>
                <dd>{euro(q.subtotalCents)}</dd>
              </div>
              <div>
                <dt>Spedizione (Italia)</dt>
                <dd>
                  {q.shippingCents === null ? "Da configurare" : q.shippingCents === 0 ? "Gratuita" : euro(q.shippingCents)}
                </dd>
              </div>
              {q.deliveryTime && (
                <div>
                  <dt>Tempi indicativi</dt>
                  <dd>{q.deliveryTime}</dd>
                </div>
              )}
              <div className="bp-total">
                <dt>Totale</dt>
                <dd>{q.totalCents === null ? "—" : euro(q.totalCents)}</dd>
              </div>
            </dl>
            <SalesClosedNote />
            {allowed && q.ok && !hasProblem ? (
              <Link to="/checkout" className="bp-button bp-button-block">
                <ShoppingBag size={17} aria-hidden="true" /> Procedi all'ordine
              </Link>
            ) : (
              <button type="button" className="bp-button bp-button-block" disabled>
                <ShoppingBag size={17} aria-hidden="true" />
                {!allowed ? "Acquisti non ancora attivi" : hasProblem ? "Correggi il carrello" : "Spedizione non configurata"}
              </button>
            )}
            <p className="bp-detail-bottom-note">Spediamo solo in Italia. Nessun ritiro in sede.</p>
          </aside>
        </div>
      )}
    </section>
  );
}
