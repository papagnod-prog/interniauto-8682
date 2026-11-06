import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Mail, Menu, MessageCircle, Phone, ShoppingBag, Truck, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { useShopInfo } from "../queries/shop";

export const WHATSAPP_HREF = "https://wa.me/393519204546";

const NAV = [
  { title: "La boutique", to: "/" },
  { title: "Il catalogo", to: "/catalogo" },
  { title: "Assistenza", to: "/assistenza" },
];

function isActive(location: string, to: string) {
  return to === "/" ? location === "/" : location.startsWith(to);
}

function Header() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { count } = useCart();
  const info = useShopInfo();
  useEffect(() => setOpen(false), [location]);

  return (
    <>
      {info.data && !info.data.salesOpen && (
        <p className="bp-notice-strip">
          <strong>NEGOZIO IN ALLESTIMENTO</strong> · Le vendite online non sono ancora attive.
          {info.data.viewerIsAdmin && " Sei collegato come amministratore: checkout in modalità TEST."}
        </p>
      )}
      <div className="bp-service-strip">
        <span>VOLANTI AUTO & TAPPEZZERIE PLURIMARCHE</span>
        <span>
          <Truck size={13} aria-hidden="true" /> Solo spedizioni in Italia
        </span>
      </div>
      <header className="bp-header bp-container">
        <Link to="/" className="bp-brand" aria-label="Interni Auto Luxury Boutique — home">
          <span className="bp-brand-symbol">
            <img src="/images/boutique/mark-dark.png" alt="" />
          </span>
          <img
            className="bp-wordmark"
            src="/images/boutique/wordmark-dark.png"
            alt="Interni Auto — Luxury Boutique"
          />
        </Link>
        <nav className="bp-desktop-nav" aria-label="Navigazione principale">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={isActive(location, item.to) ? "is-active" : ""}
              aria-current={isActive(location, item.to) ? "page" : undefined}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="bp-header-actions">
          <a className="bp-assistance-link" href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
            <MessageCircle size={17} aria-hidden="true" />
            <span>WhatsApp assistenza</span>
          </a>
          <Link to="/carrello" className="bp-bag" aria-label={`Carrello, ${count} articoli`}>
            <ShoppingBag size={19} aria-hidden="true" />
            {count > 0 ? <span className="bp-bag-count">{count}</span> : <span className="bp-bag-zero">0</span>}
          </Link>
          <button
            className="bp-menu-toggle"
            type="button"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
            aria-expanded={open}
            aria-controls="bp-mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
      {open && (
        <nav id="bp-mobile-menu" className="bp-mobile-nav bp-container" aria-label="Navigazione mobile">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to}>
              {item.title}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
          <Link to="/carrello">
            Carrello ({count})
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </nav>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer className="bp-footer">
      <div className="bp-container bp-footer-inner">
        <div className="bp-footer-brand">
          <div className="bp-footer-logo">
            <img src="/images/boutique/mark-dark.png" alt="" loading="lazy" />
            <img
              src="/images/boutique/wordmark-dark.png"
              alt="Interni Auto — Luxury Boutique, vendita di volanti e tappezzerie plurimarche"
              loading="lazy"
            />
          </div>
          <p>
            Volanti e tappezzerie plurimarche.
            <br />
            Vendita online con spedizione in Italia.
          </p>
        </div>
        <div>
          <p className="bp-eyebrow">LA BOUTIQUE</p>
          <Link to="/catalogo">Il catalogo</Link>
          <Link to="/carrello">Il carrello</Link>
          <Link to="/assistenza">Assistenza</Link>
          <p className="bp-footer-note">
            Solo spedizioni in Italia.
            <br />
            Nessun ritiro in sede.
          </p>
        </div>
        <div>
          <p className="bp-eyebrow">ASSISTENZA</p>
          <a href="mailto:info@interniautodesign.it">
            <Mail size={14} aria-hidden="true" />
            info@interniautodesign.it
          </a>
          <a href="tel:+393429402109">
            <Phone size={14} aria-hidden="true" />
            +39 342 940 2109
          </a>
          <a href={WHATSAPP_HREF} target="_blank" rel="noreferrer">
            <MessageCircle size={14} aria-hidden="true" />
            WhatsApp +39 351 920 4546
          </a>
          <p className="bp-footer-note">WhatsApp è dedicato all'assistenza: gli ordini si fanno solo dal sito.</p>
        </div>
        <div>
          <p className="bp-eyebrow">DATI AZIENDALI</p>
          <p>
            Antonio Vangi
            <br />
            Sede legale: Via D. Morelli, 15
            <br />
            Corato
          </p>
          <p className="bp-footer-note">
            P.IVA 09178390721
            <br />
            C.F. VNGNTN02R07C983O
          </p>
        </div>
      </div>
      <div className="bp-container bp-footer-bottom">
        <span>© {new Date().getFullYear()} Interni Auto · Luxury Boutique</span>
        <span>Condizioni di vendita, privacy e cookie: documenti in preparazione</span>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return (
    <div className="bp-site">
      <a className="bp-skip" href="#contenuto">
        Vai al contenuto
      </a>
      <Header />
      <main id="contenuto">{children}</main>
      <Footer />
    </div>
  );
}

export function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="bp-breadcrumb" aria-label="Percorso">
      {items.map((item, i) => (
        <span key={item.label} style={{ display: "contents" }}>
          {i > 0 && <span aria-hidden="true">/</span>}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Interni Auto — Luxury Boutique` : "Interni Auto — Luxury Boutique";
  }, [title]);
}
