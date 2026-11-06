import { Mail, MessageCircle, Phone } from "lucide-react";
import { Breadcrumb, useDocumentTitle, WHATSAPP_HREF } from "../components/site-layout";
import { useShopInfo } from "../queries/shop";

export default function AssistancePage() {
  useDocumentTitle("Assistenza");
  const info = useShopInfo();
  const shipping = info.data?.shipping;
  return (
    <section className="bp-container bp-page">
      <Breadcrumb items={[{ label: "La boutique", to: "/" }, { label: "Assistenza" }]} />
      <div className="bp-page-head">
        <p className="bp-eyebrow">ASSISTENZA CLIENTI</p>
        <h1>
          Una domanda,
          <br />
          <em>una risposta diretta.</em>
        </h1>
        <p>
          Per compatibilità, condizioni di un articolo o informazioni su un ordine già effettuato. Gli
          acquisti si completano esclusivamente sul sito: WhatsApp è dedicato all'assistenza.
        </p>
      </div>
      <div className="bp-contact-grid">
        <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
          <MessageCircle size={20} aria-hidden="true" />
          <strong>WhatsApp</strong>
          +39 351 920 4546
          <span>Solo assistenza, non ordini</span>
        </a>
        <a href="mailto:info@interniautodesign.it">
          <Mail size={20} aria-hidden="true" />
          <strong>Email</strong>
          info@interniautodesign.it
          <span>Indica il codice ordine, se ne hai uno</span>
        </a>
        <a href="tel:+393429402109">
          <Phone size={20} aria-hidden="true" />
          <strong>Telefono</strong>
          +39 342 940 2109
          <span>Antonio Vangi</span>
        </a>
      </div>
      <div className="bp-faq">
        <div>
          <p className="bp-eyebrow">DOMANDE FREQUENTI</p>
          <h2 style={{ marginTop: 18 }}>
            Prima di <em>scegliere.</em>
          </h2>
        </div>
        <dl>
          <div>
            <dt>Dove spedite?</dt>
            <dd>
              Solo in Italia (esclusi San Marino e Città del Vaticano). Non è previsto il ritiro in sede.
              {shipping && ` Tempi indicativi: ${shipping.deliveryTime}.`}
            </dd>
          </div>
          <div>
            <dt>Come si paga?</dt>
            <dd>
              Con carta, tramite la pagina di pagamento sicura di Stripe. Non accettiamo contanti né bonifici
              e non raccogliamo ordini via WhatsApp.
            </dd>
          </div>
          <div>
            <dt>Il volante o la tappezzeria è compatibile con la mia auto?</dt>
            <dd>
              Ogni scheda riporta marca e compatibilità indicate. In caso di dubbio scrivici prima
              dell'acquisto con modello e anno del veicolo.
            </dd>
          </div>
          <div>
            <dt>Posso restituire un articolo?</dt>
            <dd>
              Le condizioni di vendita, il diritto di recesso e le modalità di reso saranno pubblicati prima
              dell'apertura delle vendite online.
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
