import { useEffect, useRef } from "react";
import { Link, useParams, useSearch } from "wouter";
import { ArrowRight, CheckCircle2, Clock, Loader2, Package, XCircle } from "lucide-react";
import { useDocumentTitle, WHATSAPP_HREF } from "../components/site-layout";
import { useCart } from "../lib/cart";
import { dateTime, euro, ORDER_STATUS } from "../lib/format";
import { useOrderStatus } from "../queries/checkout";
import NotFoundPage from "./not-found";

export default function OrderPage() {
  useDocumentTitle("Il tuo ordine");
  const { token = "" } = useParams<{ token: string }>();
  const params = new URLSearchParams(useSearch());
  const canceled = params.get("annullato") === "1";
  const order = useOrderStatus(token, canceled);
  const cart = useCart();
  const cleared = useRef(false);
  const o = order.data;

  // Svuota il carrello solo quando il pagamento è confermato dal server.
  useEffect(() => {
    if (!cleared.current && o && ["paid", "shipped", "delivered"].includes(o.status)) {
      cleared.current = true;
      cart.clear();
    }
  }, [o, cart]);

  if (token.length < 40) return <NotFoundPage what="pagina" />;
  if (order.isLoading) {
    return (
      <div className="bp-loading">
        <Loader2 className="bp-spin" aria-label="Verifica dell'ordine" />
      </div>
    );
  }
  if (order.isError || !o) return <NotFoundPage what="pagina d'ordine" />;

  const paid = ["paid", "shipped", "delivered"].includes(o.status);
  const Icon = paid ? CheckCircle2 : o.status === "pending_payment" || o.status === "review" ? Clock : XCircle;
  const title = paid
    ? { a: "Grazie,", b: "ordine confermato." }
    : o.status === "pending_payment"
      ? { a: "Stiamo verificando", b: "il pagamento." }
      : o.status === "review"
        ? { a: "Ordine ricevuto,", b: "in verifica." }
        : { a: "Ordine", b: "non completato." };

  return (
    <section className="bp-container bp-page">
      <div className="bp-order-hero">
        <div>
          <p className="bp-eyebrow" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Icon size={15} aria-hidden="true" /> {ORDER_STATUS[o.status] ?? o.status}
            {o.mode === "test" && <span className="bp-test-badge">TEST · NESSUN ADDEBITO REALE</span>}
          </p>
          <h1 style={{ marginTop: 18 }}>
            {title.a}
            <br />
            <em>{title.b}</em>
          </h1>
          <p className="bp-order-code">
            CODICE ORDINE <strong>{o.code}</strong> · {dateTime(o.createdAt)}
          </p>
        </div>
        {o.status === "pending_payment" && (
          <output className="bp-status is-warn">Aggiornamento automatico…</output>
        )}
      </div>

      <div className="bp-cart-layout">
        <div style={{ display: "grid", gap: 20 }}>
          {paid && (
            <p className="bp-detail-description">
              Riceverai la conferma di pagamento da Stripe all'indirizzo email indicato.
              {o.status === "shipped" || o.status === "delivered"
                ? " Il pacco è stato affidato al corriere."
                : " Ti avviseremo quando il pacco sarà spedito."}
            </p>
          )}
          {o.status === "pending_payment" && (
            <p className="bp-detail-description">
              Se hai appena pagato, la conferma arriva in pochi secondi. Puoi lasciare aperta questa pagina.
            </p>
          )}
          {(o.status === "expired" || o.status === "canceled") && (
            <p className="bp-detail-description">
              Il pagamento non è stato completato e non ti è stato addebitato nulla. Gli articoli sono di nuovo
              disponibili: puoi riprovare dal carrello.
            </p>
          )}
          {o.status === "review" && (
            <p className="bp-detail-description">
              Il pagamento risulta ricevuto ma richiede un controllo manuale. Ti contatteremo a breve.
            </p>
          )}
          {o.trackingNumber && (
            <div className="bp-callout">
              <Package size={16} aria-hidden="true" />
              <p>
                <strong>Spedito {o.shippedAt ? `il ${dateTime(o.shippedAt)}` : ""}</strong>
                <br />
                {o.carrier && `${o.carrier} · `}Tracking {o.trackingNumber}
              </p>
            </div>
          )}
          <div className="bp-actions">
            {o.status === "expired" || o.status === "canceled" ? (
              <Link to="/carrello" className="bp-button">
                Torna al carrello <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ) : (
              <Link to="/catalogo" className="bp-button bp-button-outline">
                Continua a esplorare <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )}
            <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="bp-text-link">
              Assistenza su WhatsApp
            </a>
          </div>
          <p className="bp-detail-bottom-note" style={{ textAlign: "left" }}>
            Conserva il link di questa pagina: è personale e mostra lo stato del tuo ordine.
          </p>
        </div>
        <aside className="bp-summary" aria-label="Riepilogo ordine">
          <h2>Riepilogo</h2>
          <div className="bp-summary-lines">
            {o.items.map((l) => (
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
              <dd>{euro(o.subtotalCents)}</dd>
            </div>
            <div>
              <dt>Spedizione</dt>
              <dd>{o.shippingCents === 0 ? "Gratuita" : euro(o.shippingCents)}</dd>
            </div>
            <div>
              <dt>Consegna a</dt>
              <dd>
                {o.city} ({o.province})
              </dd>
            </div>
            <div className="bp-total">
              <dt>Totale</dt>
              <dd>{euro(o.totalCents)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
