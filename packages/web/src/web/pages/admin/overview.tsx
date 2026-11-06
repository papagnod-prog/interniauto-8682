import { Link } from "wouter";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { AdminHead, AdminLoading } from "../../components/admin-layout";
import { errorMessage } from "../../lib/format";
import { useOverview } from "../../queries/admin";

type Item = { label: string; done: boolean; hint: string; to?: string; blocked?: boolean };

export default function AdminOverviewPage() {
  const overview = useOverview();

  if (overview.isLoading) return <AdminLoading />;
  if (overview.isError || !overview.data) {
    return <p className="bp-error">{errorMessage(overview.error, "Panoramica non disponibile.")}</p>;
  }

  const { products, orders, readiness } = overview.data;
  const count = (status: string) =>
    orders.filter((o) => o.status === status).reduce((sum, o) => sum + Number(o.n), 0);
  const testOrders = orders.filter((o) => o.mode === "test").reduce((sum, o) => sum + Number(o.n), 0);

  const checklist: Item[] = [
    {
      label: "Prodotti pubblicati",
      done: products.published > 0,
      hint: products.published > 0 ? `${products.published} visibili nel negozio` : "Carica foto, prezzo e categoria, poi pubblica",
      to: "/admin/prodotti",
    },
    {
      label: "Spedizione Italia configurata",
      done: readiness.shipping,
      hint: readiness.shipping ? "Tariffa e tempi impostati" : "Tariffa, soglia gratuita e tempi di consegna",
      to: "/admin/impostazioni",
    },
    {
      label: "Stripe in modalità test",
      done: readiness.stripeTest,
      hint: readiness.stripeTest ? "Chiave di test verificata" : "Serve la chiave segreta di test (sk_test_…)",
      to: "/admin/impostazioni",
    },
    {
      label: "Webhook Stripe",
      done: readiness.stripeWebhook,
      hint: readiness.stripeWebhook ? "Segreto whsec_ salvato" : "Serve per confermare i pagamenti in automatico",
      to: "/admin/impostazioni",
    },
    {
      label: "Testi legali pubblicati",
      done: readiness.legalPublished,
      hint: "Condizioni di vendita, recesso, privacy e cookie: bozze in preparazione (Fase 3)",
      blocked: true,
    },
    {
      label: "Stripe in modalità live",
      done: readiness.stripeLive,
      hint: "Non disponibile finché i testi legali non sono approvati",
      blocked: true,
    },
  ];

  return (
    <>
      <AdminHead
        eyebrow="PANORAMICA"
        title="Il negozio, oggi"
        text="Le vendite al pubblico restano chiuse finché ogni voce qui sotto non è completa."
      />

      {!readiness.salesOpen && (
        <div className="bp-callout is-test" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} aria-hidden="true" />
          <p>
            <strong>Vendite chiuse ai visitatori.</strong> Solo tu, da loggato, puoi provare il checkout con Stripe in
            modalità test. Nessun addebito reale.
          </p>
        </div>
      )}

      <div className="bp-stats">
        <div>
          <strong>{products.published}</strong>
          <span>Prodotti pubblicati</span>
        </div>
        <div>
          <strong>{products.drafts}</strong>
          <span>Bozze</span>
        </div>
        <div>
          <strong>{count("paid") + count("review")}</strong>
          <span>Ordini da evadere</span>
        </div>
        <div>
          <strong>{products.outOfStock}</strong>
          <span>Pubblicati esauriti</span>
        </div>
      </div>

      <div className="bp-panel-grid">
        <section className="bp-panel" aria-labelledby="ready-title">
          <p className="bp-eyebrow">APERTURA</p>
          <h2 id="ready-title">Cosa manca per vendere</h2>
          <p>Ogni passaggio si completa dalla dashboard, tranne i testi legali.</p>
          <ul className="bp-checklist">
            {checklist.map((item) => (
              <li key={item.label}>
                <div>
                  {item.to && !item.done ? <Link to={item.to}>{item.label}</Link> : item.label}
                  <small>{item.hint}</small>
                </div>
                <span className={`bp-status ${item.done ? "is-ok" : item.blocked ? "is-bad" : "is-warn"}`}>
                  {item.done ? "Fatto" : item.blocked ? "Bloccato" : "Da fare"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bp-panel" aria-labelledby="orders-title">
          <p className="bp-eyebrow">ORDINI</p>
          <h2 id="orders-title">Stato degli ordini</h2>
          <p>{testOrders > 0 ? `${testOrders} ordini di prova in modalità test.` : "Nessun ordine ricevuto finora."}</p>
          <ul className="bp-checklist">
            {[
              ["paid", "Pagati, da spedire"],
              ["review", "Da verificare"],
              ["pending_payment", "In attesa di pagamento"],
              ["shipped", "Spediti"],
              ["delivered", "Consegnati"],
            ].map(([status, label]) => (
              <li key={status}>
                <span>{label}</span>
                <strong className="bp-num">{count(status!)}</strong>
              </li>
            ))}
          </ul>
          <Link to="/admin/ordini" className="bp-text-link" style={{ marginTop: 16, display: "inline-flex", gap: 8 }}>
            Vai agli ordini <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <p className="bp-detail-bottom-note">
        Archivio del vecchio sito: {products.legacy} prodotti conservati in sola lettura, non visibili nel negozio.
      </p>
    </>
  );
}
