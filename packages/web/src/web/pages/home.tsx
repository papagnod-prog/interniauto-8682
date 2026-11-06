import { Link } from "wouter";
import { ArrowDown, ArrowRight, CreditCard, MessageCircle, Truck } from "lucide-react";
import { ProductCard, ProductGridSkeleton } from "../components/product-card";
import { useDocumentTitle, WHATSAPP_HREF } from "../components/site-layout";
import { useProducts, useShopInfo } from "../queries/shop";

function Selection() {
  const featured = useProducts({ featured: true });
  const recent = useProducts({ sort: "recenti" });
  const loading = featured.isLoading || recent.isLoading;
  const items = (featured.data?.length ? featured.data : (recent.data ?? [])).slice(0, 3);

  return (
    <section id="selezione" className="bp-selection bp-container">
      <div className="bp-section-heading">
        <div>
          <p className="bp-eyebrow">01 — LA SELEZIONE</p>
          <h2>
            La tua auto.
            <br />
            <em>La tua scelta.</em>
          </h2>
        </div>
        <div className="bp-heading-aside">
          <p>
            Volanti e tappezzerie plurimarche, un'unica boutique.
            <br />
            Fotografie reali, condizioni e compatibilità in ogni scheda.
          </p>
          <Link to="/catalogo" className="bp-text-link">
            Tutto il catalogo <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
      {loading ? (
        <ProductGridSkeleton />
      ) : featured.isError || recent.isError ? (
        <p className="bp-error" role="alert">
          Impossibile caricare la selezione. Ricarica la pagina.
        </p>
      ) : items.length ? (
        <div className="bp-product-grid">
          {items.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      ) : (
        <div className="bp-empty-panel">
          <h2>
            La selezione
            <br />
            <em>è in preparazione.</em>
          </h2>
          <div>
            <p>
              Stiamo fotografando e catalogando i primi volanti e le prime tappezzerie. Per una
              richiesta su un modello specifico puoi scriverci intanto.
            </p>
            <div className="bp-actions">
              <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="bp-button bp-button-outline">
                Chiedi all'assistenza <ArrowRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  useDocumentTitle("");
  const info = useShopInfo();
  const salesOpen = info.data?.salesOpen ?? false;
  return (
    <>
      <section className="bp-hero bp-container">
        <div className="bp-hero-copy reveal">
          <p className="bp-eyebrow bp-hero-eyebrow">
            <span /> INTERNI AUTO · LUXURY BOUTIQUE
          </p>
          <h1>
            Il dettaglio
            <br />
            che cambia
            <br />
            <em>ogni viaggio.</em>
          </h1>
          <p className="bp-hero-description">
            Volanti e tappezzerie plurimarche.
            <br />
            Scegli online, ricevi a casa in tutta Italia.
          </p>
          <Link to="/catalogo" className="bp-button">
            Esplora il catalogo <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <div className="bp-hero-meta">
            <span>01 / LA SELEZIONE</span>
            <a href="#selezione" aria-label="Scorri alla selezione">
              <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="bp-hero-visual">
          <img
            src="/images/boutique/atmosfera-volante.webp"
            alt=""
            className="bp-hero-photo"
            fetchPriority="high"
          />
          <span className="bp-visual-caption">IL CARATTERE È NEI DETTAGLI</span>
          <div className="bp-hero-product-note">
            <span className="bp-eyebrow">VOLANTI · TAPPEZZERIE</span>
            <p>
              Un'altra prospettiva.
              <br />
              Lo stesso piacere di guidare.
            </p>
          </div>
        </div>
      </section>
      <div className="bp-benefits">
        <div className="bp-container bp-benefits-inner">
          <p>
            <Truck size={19} aria-hidden="true" />
            <span>
              Solo spedizione<span>Consegne in tutta Italia</span>
            </span>
          </p>
          <p>
            <CreditCard size={19} aria-hidden="true" />
            <span>
              Pagamento con carta<span>{salesOpen ? "Checkout sicuro Stripe" : "Checkout Stripe in attivazione"}</span>
            </span>
          </p>
          <p>
            <MessageCircle size={19} aria-hidden="true" />
            <span>
              Un contatto diretto<span>WhatsApp per l'assistenza</span>
            </span>
          </p>
        </div>
      </div>
      <Selection />
      <section className="bp-editorial bp-container">
        <div className="bp-editorial-image is-photo">
          <img src="/images/boutique/atmosfera-sedile.webp" loading="lazy" alt="" />
          <span className="bp-eyebrow">02 / TAPPEZZERIE PLURIMARCHE</span>
        </div>
        <div className="bp-editorial-copy">
          <p className="bp-eyebrow">UN ABITACOLO, MILLE POSSIBILITÀ</p>
          <h2>
            Il tuo stile,
            <br />
            <em>anche dentro.</em>
          </h2>
          <p>
            Una selezione dedicata agli interni. In ogni scheda trovi fotografie, condizione e
            compatibilità del singolo articolo prima di scegliere.
          </p>
          <Link to="/catalogo" className="bp-text-link">
            Vai al catalogo <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <AssistanceBand />
    </>
  );
}

export function AssistanceBand() {
  return (
    <section className="bp-assistance bp-container">
      <div>
        <p className="bp-eyebrow">PARLIAMONE</p>
        <h2>
          La scelta giusta
          <br />
          <em>inizia da una domanda.</em>
        </h2>
      </div>
      <div>
        <p>
          Dubbi su compatibilità o condizioni?
          <br />
          L'assistenza risponde su WhatsApp e per email.
        </p>
        <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer" className="bp-button bp-button-outline">
          Scrivici su WhatsApp <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
