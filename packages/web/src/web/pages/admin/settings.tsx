import { useState } from "react";
import { AlertTriangle, KeyRound, Loader2, Truck } from "lucide-react";
import { AdminHead, AdminLoading } from "../../components/admin-layout";
import { dateTime, errorMessage } from "../../lib/format";
import { useAdminSettings, useClearStripe, useSaveShipping, useSaveStripe } from "../../queries/admin";

function parseEuro(value: string): number | null {
  const clean = value.trim().replace(/\s|€/g, "");
  if (!clean) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}
const toInput = (cents: number | null | undefined) =>
  cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ",");

export default function AdminSettingsPage() {
  const settings = useAdminSettings();

  if (settings.isLoading) return <AdminLoading />;
  if (settings.isError || !settings.data) {
    return <p className="bp-error">{errorMessage(settings.error, "Impostazioni non disponibili.")}</p>;
  }
  const data = settings.data;

  return (
    <>
      <AdminHead
        eyebrow="IMPOSTAZIONI"
        title="Spedizione e pagamenti"
        text="Senza spedizione e Stripe configurati il checkout resta bloccato anche per te."
      />
      <ShippingPanel key={JSON.stringify(data.shipping)} shipping={data.shipping} />
      <StripePanel data={data} />
    </>
  );
}

type Shipping = {
  flatRateCents: number;
  freeOverCents: number | null;
  carrier: string;
  deliveryTime: string;
  note: string;
} | null;

function ShippingPanel({ shipping }: { shipping: Shipping }) {
  const save = useSaveShipping();
  const [rate, setRate] = useState(toInput(shipping?.flatRateCents));
  const [freeOver, setFreeOver] = useState(toInput(shipping?.freeOverCents));
  const [carrier, setCarrier] = useState(shipping?.carrier ?? "");
  const [deliveryTime, setDeliveryTime] = useState(shipping?.deliveryTime ?? "");
  const [note, setNote] = useState(shipping?.note ?? "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const flatRateCents = parseEuro(rate);
    const freeOverCents = freeOver.trim() ? parseEuro(freeOver) : null;
    if (flatRateCents === null) return setError("Tariffa non valida. Esempio: 9,90 (0 per spedizione sempre gratuita).");
    if (freeOver.trim() && !freeOverCents) return setError("Soglia gratuita non valida, oppure lasciala vuota.");
    if (deliveryTime.trim().length < 2) return setError("Indica i tempi di consegna, es. 2–4 giorni lavorativi.");
    try {
      await save.mutateAsync({
        flatRateCents,
        freeOverCents,
        carrier: carrier.trim(),
        deliveryTime: deliveryTime.trim(),
        note: note.trim(),
      });
      setNotice("Spedizione salvata.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section className="bp-panel" aria-labelledby="ship-title">
      <p className="bp-eyebrow">SOLO ITALIA</p>
      <h2 id="ship-title">Spedizione</h2>
      <p>
        Tariffa unica per tutta Italia (San Marino, Vaticano e estero esclusi). Nessun ritiro in sede, nessun contrassegno.
      </p>
      {!shipping && (
        <div className="bp-callout" style={{ marginBottom: 18 }}>
          <Truck size={16} aria-hidden="true" />
          <p>
            <strong>Non ancora configurata.</strong> Inserisci tariffa e tempi reali concordati con il corriere.
          </p>
        </div>
      )}
      <form className="bp-form-grid" onSubmit={submit} noValidate>
        <label className="bp-field bp-span-2" htmlFor="s-rate">
          <span>Tariffa IVA inclusa (€) *</span>
          <input aria-label="Tariffa IVA inclusa (€)"
            id="s-rate"
            className="bp-input"
            inputMode="decimal"
            placeholder="9,90"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <label className="bp-field bp-span-2" htmlFor="s-free">
          <span>Gratuita da (€)</span>
          <input aria-label="Gratuita da (€)"
            id="s-free"
            className="bp-input"
            inputMode="decimal"
            placeholder="vuoto = mai"
            value={freeOver}
            onChange={(e) => setFreeOver(e.target.value)}
          />
        </label>
        <label className="bp-field bp-span-2" htmlFor="s-carrier">
          <span>Corriere</span>
          <input aria-label="Corriere"
            id="s-carrier"
            className="bp-input"
            maxLength={80}
            placeholder="es. BRT"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </label>
        <label className="bp-field bp-span-3" htmlFor="s-time">
          <span>Tempi di consegna *</span>
          <input aria-label="Tempi di consegna"
            id="s-time"
            className="bp-input"
            maxLength={80}
            placeholder="2–4 giorni lavorativi"
            value={deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
          />
        </label>
        <label className="bp-field bp-span-3" htmlFor="s-note">
          <span>Nota al checkout</span>
          <input aria-label="Nota al checkout"
            id="s-note"
            className="bp-input"
            maxLength={400}
            placeholder="es. Spedizione assicurata con tracking"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="bp-span-6 bp-actions" style={{ gap: 14 }}>
          <button type="submit" className="bp-button bp-button-small" disabled={save.isPending}>
            {save.isPending && <Loader2 size={14} className="bp-spin" aria-hidden="true" />} Salva spedizione
          </button>
          {(error || notice) && (
            <p className={error ? "bp-error" : "bp-success"} role={error ? "alert" : "status"}>
              {error || notice}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

type SettingsData = NonNullable<ReturnType<typeof useAdminSettings>["data"]>;

function StripePanel({ data }: { data: SettingsData }) {
  const saveStripe = useSaveStripe();
  const clearStripe = useClearStripe();
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const s = data.stripe;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const key = secretKey.trim();
    const hook = webhookSecret.trim();
    if (!key && !hook) return setError("Inserisci almeno un valore.");
    if (key && !/^(sk|rk)_test_/.test(key)) {
      return setError("Qui va solo una chiave di TEST (sk_test_… o rk_test_…). Le chiavi live non sono ammesse.");
    }
    if (hook && !hook.startsWith("whsec_")) return setError("Il segreto webhook inizia con whsec_.");
    try {
      await saveStripe.mutateAsync({
        ...(key ? { testSecretKey: key } : {}),
        ...(hook ? { testWebhookSecret: hook } : {}),
      });
      setSecretKey("");
      setWebhookSecret("");
      setNotice(key ? "Chiave verificata con Stripe e salvata cifrata." : "Segreto webhook salvato cifrato.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const clear = async () => {
    if (!window.confirm("Rimuovere chiave e segreto Stripe salvati dalla dashboard? Il checkout si bloccherà.")) return;
    setError("");
    setNotice("");
    try {
      await clearStripe.mutateAsync({});
      setNotice("Credenziali Stripe rimosse.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <section className="bp-panel" aria-labelledby="stripe-title">
      <p className="bp-eyebrow">
        PAGAMENTI <span className="bp-test-badge">SOLO TEST</span>
      </p>
      <h2 id="stripe-title">Stripe</h2>
      <p>
        I clienti pagano sulla pagina sicura di Stripe; qui non transitano dati di carta. La modalità live verrà attivata
        solo dopo l'approvazione dei testi legali.
      </p>

      <dl className="bp-kv" style={{ marginBottom: 22 }}>
        <dt>Chiave segreta test</dt>
        <dd>
          {s.testSecretKey ? (
            <>
              <code>{s.testSecretKey}</code> {s.source === "env" ? "(da configurazione server)" : ""}
            </>
          ) : (
            <span className="bp-status is-warn">Non impostata</span>
          )}
        </dd>
        <dt>Account Stripe</dt>
        <dd>{s.accountName ?? "—"}</dd>
        <dt>Verificata il</dt>
        <dd>{dateTime(s.verifiedAt)}</dd>
        <dt>Segreto webhook</dt>
        <dd>
          {s.testWebhookSecret ? <code>{s.testWebhookSecret}</code> : <span className="bp-status is-warn">Non impostato</span>}
        </dd>
        <dt>Modalità live</dt>
        <dd>
          <span className="bp-status is-bad">Non disponibile</span>
        </dd>
      </dl>

      <form className="bp-form-grid" onSubmit={submit} noValidate autoComplete="off">
        <label className="bp-field bp-span-3" htmlFor="st-key">
          <span>{s.testSecretKey ? "Sostituisci chiave segreta test" : "Chiave segreta test"}</span>
          <input
            aria-label="Chiave segreta Stripe di test"
            id="st-key"
            className="bp-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="sk_test_…"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
          <small>Stripe → Sviluppatori → Chiavi API (modalità test).</small>
        </label>
        <label className="bp-field bp-span-3" htmlFor="st-hook">
          <span>{s.testWebhookSecret ? "Sostituisci segreto webhook" : "Segreto di firma webhook"}</span>
          <input
            aria-label="Segreto di firma webhook Stripe"
            id="st-hook"
            className="bp-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="whsec_…"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
          />
          <small>Visibile dopo aver creato l'endpoint qui sotto.</small>
        </label>
        <div className="bp-span-6 bp-actions" style={{ gap: 10 }}>
          <button type="submit" className="bp-button bp-button-small" disabled={saveStripe.isPending}>
            {saveStripe.isPending ? (
              <Loader2 size={14} className="bp-spin" aria-hidden="true" />
            ) : (
              <KeyRound size={14} aria-hidden="true" />
            )}
            Verifica e salva
          </button>
          {(s.source === "dashboard" || s.testWebhookSecret) && (
            <button
              type="button"
              className="bp-button bp-button-danger bp-button-small"
              onClick={clear}
              disabled={clearStripe.isPending}
            >
              {clearStripe.isPending && <Loader2 size={14} className="bp-spin" aria-hidden="true" />} Rimuovi credenziali
            </button>
          )}
        </div>
        {(error || notice) && (
          <p className={`bp-span-6 ${error ? "bp-error" : "bp-success"}`} role={error ? "alert" : "status"}>
            {error || notice}
          </p>
        )}
      </form>

      <h3 style={{ marginTop: 32, marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Endpoint webhook</h3>
      <p className="bp-detail-bottom-note" style={{ marginBottom: 10, textAlign: "left" }}>
        In Stripe (modalità test) → Sviluppatori → Webhook → Aggiungi endpoint. Usa questo URL e seleziona gli eventi
        elencati.
      </p>
      <code className="bp-code">{data.webhookUrl}</code>
      <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 12, lineHeight: 1.9 }}>
        {data.webhookEvents.map((ev) => (
          <li key={ev}>
            <code>{ev}</code>
          </li>
        ))}
      </ul>
      {data.webhookUrl.includes("localhost") && (
        <div className="bp-callout" style={{ marginTop: 16 }}>
          <AlertTriangle size={16} aria-hidden="true" />
          <p>L'URL è locale: registra l'endpoint dopo la pubblicazione del sito, con il dominio definitivo.</p>
        </div>
      )}

      <h3 style={{ marginTop: 28, marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Ultimi eventi ricevuti</h3>
      {data.recentEvents.length ? (
        <ul className="bp-checklist">
          {data.recentEvents.map((ev) => (
            <li key={ev.id}>
              <span>
                <code>{ev.type}</code> {ev.mode === "test" && <span className="bp-test-badge">TEST</span>}
              </span>
              <small>{dateTime(ev.receivedAt)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="bp-detail-bottom-note">Nessun evento ricevuto finora.</p>
      )}
    </section>
  );
}
