import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Truck } from "lucide-react";
import { AdminHead, AdminLoading } from "../../components/admin-layout";
import { dateTime, errorMessage, euro, ORDER_STATUS } from "../../lib/format";
import { type OrderStatus, useAdminOrder, useAdminOrders, useUpdateOrder } from "../../queries/admin";

const TONE: Record<string, string> = {
  paid: "is-warn",
  review: "is-bad",
  shipped: "is-ok",
  delivered: "is-ok",
  pending_payment: "",
  expired: "",
  canceled: "",
};

const FILTERS: { value: OrderStatus | undefined; label: string }[] = [
  { value: undefined, label: "Tutti" },
  { value: "paid", label: "Da spedire" },
  { value: "review", label: "Da verificare" },
  { value: "shipped", label: "Spediti" },
  { value: "delivered", label: "Consegnati" },
  { value: "pending_payment", label: "In attesa" },
];

function TestBadge({ mode }: { mode: string }) {
  return mode === "test" ? <span className="bp-test-badge">TEST</span> : null;
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const list = useAdminOrders(status);

  return (
    <>
      <AdminHead
        eyebrow="VENDITE"
        title="Ordini"
        text="Gli ordini diventano “Pagato” solo dopo la conferma di Stripe. Spedizione esclusivamente in Italia."
      />
      <div className="bp-tabs" role="tablist" aria-label="Filtra ordini">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            role="tab"
            aria-selected={status === f.value}
            className={status === f.value ? "is-active" : ""}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <AdminLoading />
      ) : list.isError ? (
        <p className="bp-error">{errorMessage(list.error)}</p>
      ) : !list.data?.length ? (
        <div className="bp-empty-panel">
          <p className="bp-eyebrow">NESSUN ORDINE</p>
          <h2>{status ? "Nessun ordine in questo stato" : "Ancora nessun ordine"}</h2>
          <p>Gli ordini compaiono qui quando un cliente avvia il pagamento.</p>
        </div>
      ) : (
        <div className="bp-table-wrap">
          <table className="bp-table">
            <thead>
              <tr>
                <th scope="col">Ordine</th>
                <th scope="col">Cliente</th>
                <th scope="col">Stato</th>
                <th scope="col" className="bp-num">
                  Pezzi
                </th>
                <th scope="col" className="bp-num">
                  Totale
                </th>
                <th scope="col">Data</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/admin/ordini/${o.id}`}>
                      <strong>{o.code}</strong>
                    </Link>{" "}
                    <TestBadge mode={o.mode} />
                  </td>
                  <td>
                    {o.customerName}
                    <br />
                    <small style={{ color: "var(--bp-muted)" }}>
                      {o.city} ({o.province})
                    </small>
                  </td>
                  <td>
                    <span className={`bp-status ${TONE[o.status] ?? ""}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
                  </td>
                  <td className="bp-num">{o.itemCount}</td>
                  <td className="bp-num">{euro(o.totalCents)}</td>
                  <td>{dateTime(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function AdminOrderDetailPage({ id }: { id: string }) {
  const order = useAdminOrder(id);
  const update = useUpdateOrder();
  const [carrier, setCarrier] = useState<string | null>(null);
  const [tracking, setTracking] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const back = (
    <Link to="/admin/ordini" className="bp-text-link" style={{ display: "inline-flex", gap: 8, marginBottom: 18 }}>
      <ArrowLeft size={14} aria-hidden="true" /> Tutti gli ordini
    </Link>
  );

  if (order.isLoading) return <AdminLoading />;
  if (order.isError || !order.data) {
    return (
      <>
        {back}
        <p className="bp-error">{errorMessage(order.error, "Ordine non trovato.")}</p>
      </>
    );
  }
  const o = order.data;
  const carrierValue = carrier ?? o.carrier;
  const trackingValue = tracking ?? o.trackingNumber;
  const noteValue = note ?? o.adminNote;

  type Action = "shipped" | "delivered" | "paid" | "paid_confirmed" | "canceled_review" | "note";
  const run = async (action: Action, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError("");
    setNotice("");
    if (action === "shipped" && !trackingValue.trim()) return setError("Inserisci il numero di tracking.");
    setPendingAction(action);
    try {
      await update.mutateAsync({
        id: o.id,
        action,
        ...(action === "shipped" ? { carrier: carrierValue.trim(), trackingNumber: trackingValue.trim() } : {}),
        ...(action === "note" ? { adminNote: noteValue } : {}),
      });
      setNotice(action === "note" ? "Nota salvata." : "Stato aggiornato.");
      if (action === "note") setNote(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPendingAction("");
    }
  };
  const spin = (action: string) =>
    pendingAction === action ? <Loader2 size={14} className="bp-spin" aria-hidden="true" /> : null;

  return (
    <>
      {back}
      <AdminHead
        eyebrow={`ORDINE · ${dateTime(o.createdAt)}`}
        title={
          <>
            {o.code} <TestBadge mode={o.mode} />
          </>
        }
        text={ORDER_STATUS[o.status] ?? o.status}
      />

      {o.mode === "test" && (
        <div className="bp-callout is-test" style={{ marginBottom: 24 }}>
          <Truck size={16} aria-hidden="true" />
          <p>
            <strong>Ordine di prova.</strong> Pagato con carta di test Stripe: nessun incasso reale, non spedire.
          </p>
        </div>
      )}
      {o.status === "review" && (
        <div className="bp-callout is-danger" style={{ marginBottom: 24 }}>
          <Truck size={16} aria-hidden="true" />
          <p>
            <strong>Da verificare.</strong> Il pagamento è arrivato dopo la scadenza della prenotazione o con una
            giacenza insufficiente. Controlla su Stripe prima di confermare o annullare (l'eventuale rimborso si fa dal
            pannello Stripe).
          </p>
        </div>
      )}

      <div className="bp-panel-grid" style={{ alignItems: "start" }}>
        <section className="bp-panel" aria-labelledby="order-items">
          <h2 id="order-items">Articoli</h2>
          <ul className="bp-checklist">
            {o.items.map((item) => (
              <li key={item.productId}>
                <div>
                  {item.name}
                  <small>
                    {item.qty} × {euro(item.unitCents)}
                  </small>
                </div>
                <strong className="bp-num">{euro(item.unitCents * item.qty)}</strong>
              </li>
            ))}
            <li>
              <span>Subtotale</span>
              <span className="bp-num">{euro(o.subtotalCents)}</span>
            </li>
            <li>
              <span>Spedizione</span>
              <span className="bp-num">{o.shippingCents ? euro(o.shippingCents) : "Gratuita"}</span>
            </li>
            <li>
              <strong>Totale</strong>
              <strong className="bp-num">{euro(o.totalCents)}</strong>
            </li>
          </ul>
          <dl className="bp-kv" style={{ marginTop: 20 }}>
            <dt>Pagato il</dt>
            <dd>{dateTime(o.paidAt)}</dd>
            <dt>Pagamento Stripe</dt>
            <dd style={{ wordBreak: "break-all" }}>{o.stripePaymentIntentId ?? "—"}</dd>
            <dt>Spedito il</dt>
            <dd>{dateTime(o.shippedAt)}</dd>
          </dl>
        </section>

        <section className="bp-panel" aria-labelledby="order-ship">
          <h2 id="order-ship">Spedizione</h2>
          <dl className="bp-kv">
            <dt>Destinatario</dt>
            <dd>{o.customerName}</dd>
            <dt>Indirizzo</dt>
            <dd>
              {o.addressLine1}
              {o.addressLine2 && (
                <>
                  <br />
                  {o.addressLine2}
                </>
              )}
              <br />
              {o.postalCode} {o.city} ({o.province}) · Italia
            </dd>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${o.email}`}>{o.email}</a>
            </dd>
            <dt>Telefono</dt>
            <dd>
              <a href={`tel:${o.phone}`}>{o.phone}</a>
            </dd>
            {o.customerNote && (
              <>
                <dt>Note del cliente</dt>
                <dd>{o.customerNote}</dd>
              </>
            )}
          </dl>

          {(o.status === "paid" || o.status === "shipped") && (
            <div className="bp-form-grid" style={{ marginTop: 22 }}>
              <label className="bp-field bp-span-2" htmlFor="o-carrier">
                <span>Corriere</span>
                <input aria-label="Corriere"
                  id="o-carrier"
                  className="bp-input"
                  value={carrierValue}
                  maxLength={80}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </label>
              <label className="bp-field bp-span-4" htmlFor="o-tracking">
                <span>Numero di tracking</span>
                <input aria-label="Numero di tracking"
                  id="o-tracking"
                  className="bp-input"
                  value={trackingValue}
                  maxLength={120}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </label>
            </div>
          )}

          <div className="bp-actions" style={{ marginTop: 18, gap: 10, flexWrap: "wrap" }}>
            {o.status === "paid" && (
              <button type="button" className="bp-button bp-button-small" disabled={!!pendingAction} onClick={() => run("shipped")}>
                {spin("shipped")} Segna come spedito
              </button>
            )}
            {o.status === "shipped" && (
              <>
                <button type="button" className="bp-button bp-button-small" disabled={!!pendingAction} onClick={() => run("delivered")}>
                  {spin("delivered")} Segna come consegnato
                </button>
                <button
                  type="button"
                  className="bp-button bp-button-outline bp-button-small"
                  disabled={!!pendingAction}
                  onClick={() => run("shipped")}
                >
                  {spin("shipped")} Aggiorna tracking
                </button>
                <button
                  type="button"
                  className="bp-button bp-button-outline bp-button-small"
                  disabled={!!pendingAction}
                  onClick={() => run("paid", "Riportare l'ordine a “Pagato, da spedire”?")}
                >
                  {spin("paid")} Annulla spedizione
                </button>
              </>
            )}
            {o.status === "delivered" && (
              <button
                type="button"
                className="bp-button bp-button-outline bp-button-small"
                disabled={!!pendingAction}
                onClick={() => run("shipped", "Riportare l'ordine a “Spedito”?")}
              >
                {spin("shipped")} Riporta a spedito
              </button>
            )}
            {o.status === "review" && (
              <>
                <button
                  type="button"
                  className="bp-button bp-button-small"
                  disabled={!!pendingAction}
                  onClick={() => run("paid_confirmed", "Hai verificato su Stripe che il pagamento è riuscito?")}
                >
                  {spin("paid_confirmed")} Pagamento verificato
                </button>
                <button
                  type="button"
                  className="bp-button bp-button-danger bp-button-small"
                  disabled={!!pendingAction}
                  onClick={() => run("canceled_review", "Annullare l'ordine? Il rimborso va fatto dal pannello Stripe.")}
                >
                  {spin("canceled_review")} Annulla ordine
                </button>
              </>
            )}
          </div>

          <label className="bp-field" htmlFor="o-note" style={{ marginTop: 26 }}>
            <span>Nota interna (non visibile al cliente)</span>
            <textarea aria-label="Nota interna (non visibile al cliente)"
              id="o-note"
              className="bp-input"
              rows={3}
              maxLength={2000}
              value={noteValue}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="bp-button bp-button-outline bp-button-small"
            style={{ marginTop: 10 }}
            disabled={!!pendingAction || note === null}
            onClick={() => run("note")}
          >
            {spin("note")} Salva nota
          </button>
          {(error || notice) && (
            <p className={error ? "bp-error" : "bp-success"} role={error ? "alert" : "status"} style={{ marginTop: 12 }}>
              {error || notice}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
