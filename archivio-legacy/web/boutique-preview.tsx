import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Mail,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  Search,
  ShoppingBag,
  Sun,
  Truck,
  X,
} from "lucide-react";
import { demoPrice, previewProducts, type PreviewProduct } from "../lib/preview-data";
import "../preview.css";

type Theme = "scura" | "chiara";
type Page = "home" | "catalogo" | "scheda";

function pathFor(theme: Theme, page: Page, product = "cupra") {
  return `/anteprima/${theme}${page === "catalogo" ? "/catalogo" : page === "scheda" ? `/prodotto/${product}` : ""}`;
}

function PreviewBar({ theme, page, product }: { theme: Theme; page: Page; product: string }) {
  return (
    <aside className="bp-comparison" aria-label="Confronto delle proposte grafiche">
      <div className="bp-comparison-inner">
        <div className="bp-preview-label">
          <span className="bp-status-dot" /> <strong>ANTEPRIMA</strong>
          <span className="bp-phase">Fase 1 · scegli la tua boutique</span>
        </div>
        <div className="bp-theme-links" aria-label="Tema grafico">
          <Link
            to={pathFor("scura", page, product)}
            aria-current={theme === "scura" ? "true" : undefined}
            className={theme === "scura" ? "is-selected" : ""}
          >
            <Moon size={14} aria-hidden="true" /> A · Scura
          </Link>
          <Link
            to={pathFor("chiara", page, product)}
            aria-current={theme === "chiara" ? "true" : undefined}
            className={theme === "chiara" ? "is-selected" : ""}
          >
            <Sun size={15} aria-hidden="true" /> B · Chiara
          </Link>
        </div>
        <span className="bp-demo-notice">Solo dimostrativa · acquisti disabilitati</span>
      </div>
    </aside>
  );
}

function Header({ theme, page }: { theme: Theme; page: Page }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => setOpen(false), [location]);
  const nav = [
    { title: "La boutique", page: "home" },
    { title: "Il catalogo", page: "catalogo" },
    { title: "Scheda esempio", page: "scheda" },
  ] as const;
  return (
    <>
      <div className="bp-service-strip">
        <span>VOLANTI AUTO & TAPPEZZERIE PLURIMARCHE</span>
        <span>
          <Truck size={13} aria-hidden="true" /> Solo spedizioni in Italia
        </span>
      </div>
      <header className="bp-header bp-container">
        <Link
          to={pathFor(theme, "home")}
          className="bp-brand"
          aria-label="Interni Auto Luxury Boutique — home"
        >
          <span className="bp-brand-symbol">
            <img src={`/images/boutique/mark-${theme === "scura" ? "dark" : "light"}.png`} alt="" />
          </span>
          <img
            className="bp-wordmark"
            src={`/images/boutique/wordmark-${theme === "scura" ? "dark" : "light"}.png`}
            alt="Interni Auto — Luxury Boutique"
          />
        </Link>
        <nav className="bp-desktop-nav" aria-label="Navigazione principale">
          {nav.map((item) => (
            <Link
              key={item.page}
              to={pathFor(theme, item.page)}
              className={page === item.page ? "is-active" : ""}
              aria-current={page === item.page ? "page" : undefined}
            >
              {item.title}
            </Link>
          ))}
        </nav>
        <div className="bp-header-actions">
          <a
            className="bp-assistance-link"
            href="https://wa.me/393519204546"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle size={17} aria-hidden="true" />
            <span>Assistenza</span>
          </a>
          <span className="bp-bag" title="Carrello non attivo in anteprima">
            <ShoppingBag size={19} aria-hidden="true" />
            <span className="bp-bag-zero">0</span>
            <span className="bp-sr-only">Carrello non attivo in anteprima</span>
          </span>
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
        <nav
          id="bp-mobile-menu"
          className="bp-mobile-nav bp-container"
          aria-label="Navigazione mobile"
        >
          {nav.map((item) => (
            <Link key={item.page} to={pathFor(theme, item.page)}>
              {item.title}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}

function ProductCard({
  product,
  theme,
  index,
}: {
  product: PreviewProduct;
  theme: Theme;
  index: number;
}) {
  return (
    <article className="bp-product-card">
      <Link
        to={pathFor(theme, "scheda", product.id)}
        className={`bp-product-picture bp-picture-${product.id}`}
        aria-label={`Visualizza l'esempio ${product.name}`}
      >
        <span className="bp-example-chip">ESEMPIO · NON IN VENDITA</span>
        <img
          src={product.image}
          alt={`${product.name} ${product.subtitle} — immagine dimostrativa`}
          loading="lazy"
        />
        <span className="bp-image-number">0{index + 1}</span>
        <span className="bp-card-arrow">
          <ArrowRight size={21} aria-hidden="true" />
        </span>
      </Link>
      <div className="bp-product-info">
        <div>
          <p className="bp-eyebrow">
            {product.category} / {product.brand}
          </p>
          <h3>
            <Link to={pathFor(theme, "scheda", product.id)}>{product.name}</Link>
          </h3>
          <p className="bp-product-model">{product.subtitle}</p>
        </div>
        <div className="bp-product-price">
          <strong>{demoPrice(product.price)}</strong>
          <span>Prezzo demo</span>
        </div>
      </div>
    </article>
  );
}

function Home({ theme }: { theme: Theme }) {
  return (
    <>
      <section className="bp-hero bp-container">
        <div className="bp-hero-copy">
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
            Un nuovo modo di scegliere gli interni della tua auto.
          </p>
          <Link to={pathFor(theme, "catalogo")} className="bp-button">
            Esplora la selezione <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <div className="bp-hero-meta">
            <span>01 / LA SELEZIONE</span>
            <a href="#selezione" aria-label="Scorri alla selezione">
              <ArrowDown size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="bp-hero-visual">
          <div className="bp-orbit" />
          <span className="bp-visual-caption">IL CARATTERE È NEI DETTAGLI</span>
          <img
            src="/images/boutique/demo-volante-cupra.webp"
            alt="Volante Cupra — fotografia usata solo come esempio grafico"
            className="bp-hero-wheel"
            fetchPriority="high"
          />
          <div className="bp-hero-product-note">
            <span className="bp-eyebrow">VOLANTI / CUPRA</span>
            <p>
              Un'altra prospettiva.
              <br />
              Lo stesso piacere di guidare.
            </p>
            <span className="bp-visual-demo">Fotografia dimostrativa · non in vendita</span>
          </div>
          <Link
            className="bp-hero-detail-link"
            to={pathFor(theme, "scheda")}
            aria-label="Apri la scheda dimostrativa del volante Cupra"
          >
            <ArrowRight size={23} />
          </Link>
        </div>
      </section>
      <div className="bp-benefits">
        <div className="bp-container bp-benefits-inner">
          <p>
            <Truck size={19} aria-hidden="true" />
            <span>
              Solo spedizione<span>Consegne in Italia</span>
            </span>
          </p>
          <p>
            <CreditCard size={19} aria-hidden="true" />
            <span>
              Acquisto online<span>Stripe nel negozio definitivo</span>
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
      <section id="selezione" className="bp-selection bp-container">
        <div className="bp-section-heading">
          <div>
            <p className="bp-eyebrow">01 — IL CATALOGO</p>
            <h2>
              La tua auto.
              <br />
              <em>La tua scelta.</em>
            </h2>
          </div>
          <div className="bp-heading-aside">
            <p>
              Volanti e tappezzerie, un'unica boutique.
              <br />
              Questi articoli illustrano il futuro catalogo.
            </p>
            <Link to={pathFor(theme, "catalogo")} className="bp-text-link">
              Esplora gli esempi <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="bp-product-grid">
          {previewProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} theme={theme} index={i} />
          ))}
        </div>
        <p className="bp-demo-footnote">
          Fotografie e prezzi sono dimostrativi. Il catalogo commerciale verrà inserito dalla
          dashboard.
        </p>
      </section>
      <section className="bp-editorial bp-container">
        <div className="bp-editorial-image">
          <img
            src="/images/boutique/demo-tappezzeria.webp"
            loading="lazy"
            alt="Tappezzeria DS3 — esempio di fotografia prodotto"
          />
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
            Una selezione dedicata agli interni. Nel nuovo catalogo potrai esplorare fotografie,
            condizioni e compatibilità prima di scegliere.
          </p>
          <Link to={`${pathFor(theme, "catalogo")}?categoria=Tappezzerie`} className="bp-text-link">
            Scopri le tappezzerie <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <Assistance />
    </>
  );
}

function Catalog({ theme }: { theme: Theme }) {
  const initialCategory = new URLSearchParams(window.location.search).get("categoria") ?? "Tutti";
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("selezione");
  const items = [...previewProducts]
    .filter(
      (p) =>
        (category === "Tutti" || p.category === category) &&
        `${p.name} ${p.subtitle} ${p.brand}`.toLowerCase().includes(search.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "crescente" ? a.price - b.price : sort === "decrescente" ? b.price - a.price : 0,
    );
  return (
    <section className="bp-container bp-catalog">
      <div className="bp-breadcrumb">
        <Link to={pathFor(theme, "home")}>La boutique</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span>Il catalogo</span>
      </div>
      <div className="bp-section-heading">
        <div>
          <p className="bp-eyebrow">LA SELEZIONE INTERNI AUTO</p>
          <h1>
            Ogni dettaglio,
            <br />
            <em>una possibilità.</em>
          </h1>
        </div>
        <p className="bp-catalog-intro">
          Volanti e tappezzerie plurimarche.
          <br />
          Esplora i prodotti dimostrativi per valutare
          <br className="bp-desktop-break" /> il nuovo catalogo, non ancora in vendita.
        </p>
      </div>
      <div className="bp-catalog-controls">
        <div className="bp-filters" aria-label="Categorie di prodotti">
          {["Tutti", "Volanti", "Tappezzerie"].map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setCategory(value)}
              aria-pressed={category === value}
              className={category === value ? "is-active" : ""}
            >
              {value}
              <span>{value === "Tutti" ? "03" : value === "Volanti" ? "02" : "01"}</span>
            </button>
          ))}
        </div>
        <div className="bp-catalog-tools">
          <label className="bp-search">
            <Search size={16} aria-hidden="true" />
            <span className="bp-sr-only">Cerca un prodotto dimostrativo</span>
            <input
              aria-label="Cerca un prodotto dimostrativo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca marca o modello"
              type="search"
            />
          </label>
          <label className="bp-sort">
            <span className="bp-sr-only">Ordina gli esempi</span>
            <select
              aria-label="Ordina gli esempi"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="selezione">La selezione</option>
              <option value="crescente">Prezzo demo crescente</option>
              <option value="decrescente">Prezzo demo decrescente</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </label>
        </div>
      </div>
      <p className="bp-results" aria-live="polite">
        {items.length} {items.length === 1 ? "esempio" : "esempi"} · Nessun articolo acquistabile
      </p>
      <h2 className="bp-sr-only">Prodotti dimostrativi</h2>
      {items.length ? (
        <div className="bp-product-grid">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              theme={theme}
              index={previewProducts.findIndex((p) => p.id === product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bp-empty">
          <Search size={30} aria-hidden="true" />
          <h2>Nessun esempio trovato</h2>
          <p>Prova un'altra marca o modifica i filtri.</p>
          <button
            type="button"
            className="bp-text-link"
            onClick={() => {
              setCategory("Tutti");
              setSearch("");
            }}
          >
            Ripristina la selezione <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      )}
      <p className="bp-demo-footnote">
        Le compatibilità e i prezzi definitivi saranno indicati nei prodotti reali. Le foto
        dell'anteprima provengono dall'archivio esistente.
      </p>
    </section>
  );
}

function Product({ theme, product }: { theme: Theme; product: PreviewProduct }) {
  const [photo, setPhoto] = useState(0);
  useEffect(() => setPhoto(0), [product.id]);
  const photos = [product.image, product.original, product.other];
  return (
    <>
      <section className="bp-container bp-detail">
        <div className="bp-breadcrumb">
          <Link to={pathFor(theme, "home")}>La boutique</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link to={pathFor(theme, "catalogo")}>Il catalogo</Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span>{product.name}</span>
        </div>
        <div className="bp-detail-grid">
          <div className="bp-gallery">
            <div
              className={`bp-detail-picture ${photo > 0 ? "bp-original-photo" : ""} bp-picture-${product.id}`}
            >
              <span className="bp-example-chip">ESEMPIO · NON IN VENDITA</span>
              <img
                src={photos[photo]}
                alt={`${product.name} ${product.subtitle} — fotografia dimostrativa ${photo + 1}`}
              />
              <span className="bp-photo-counter">0{photo + 1} / 03</span>
            </div>
            <div className="bp-thumbnails" aria-label="Fotografie dell'esempio">
              {photos.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  className={photo === i ? "is-active" : ""}
                  aria-label={`Mostra fotografia ${i + 1}`}
                  aria-pressed={photo === i}
                  onClick={() => setPhoto(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
              <span>
                Fotografie d'archivio,
                <br />
                solo per l'anteprima.
              </span>
            </div>
          </div>
          <div className="bp-detail-copy">
            <p className="bp-eyebrow">
              {product.category} / {product.brand}
            </p>
            <h1>
              {product.name}
              <br />
              <em>{product.subtitle}</em>
            </h1>
            <div className="bp-detail-price">
              {demoPrice(product.price)}
              <span>Prezzo dimostrativo</span>
            </div>
            <p className="bp-detail-description">{product.text}</p>
            <div className="bp-example-box">
              <Check size={16} aria-hidden="true" />
              <p>
                <strong>Questa è una scheda di esempio.</strong> Non rappresenta un'offerta di
                vendita. Specifiche, prezzo e compatibilità sono da confermare sul prodotto reale.
              </p>
            </div>
            <dl className="bp-specifications">
              <div>
                <dt>Marca nell'esempio</dt>
                <dd>{product.brand}</dd>
              </div>
              <div>
                <dt>Modello nell'esempio</dt>
                <dd>{product.subtitle}</dd>
              </div>
              <div>
                <dt>Condizione e disponibilità</dt>
                <dd>Da inserire nel catalogo reale</dd>
              </div>
              <div>
                <dt>Spedizione</dt>
                <dd>Italia · tariffe e tempi da configurare</dd>
              </div>
            </dl>
            <button className="bp-button bp-disabled-buy" type="button" disabled>
              <ShoppingBag size={17} aria-hidden="true" />
              Acquisti disabilitati in anteprima
            </button>
            <a
              href="https://wa.me/393519204546"
              target="_blank"
              rel="noreferrer"
              className="bp-detail-assistance"
            >
              <MessageCircle size={17} aria-hidden="true" />
              Contatta l'assistenza
            </a>
            <p className="bp-detail-bottom-note">
              Il negozio definitivo utilizzerà Stripe. Nessun pagamento è attivo in questa
              anteprima.
            </p>
          </div>
        </div>
        <Link className="bp-text-link bp-return" to={pathFor(theme, "catalogo")}>
          <ArrowLeft size={17} aria-hidden="true" /> Torna alla selezione
        </Link>
      </section>
      <section className="bp-container bp-related">
        <div className="bp-section-heading">
          <div>
            <p className="bp-eyebrow">ALTRE PROSPETTIVE</p>
            <h2>
              Continua <em>a esplorare.</em>
            </h2>
          </div>
        </div>
        <div className="bp-product-grid">
          {previewProducts
            .filter((p) => p.id !== product.id)
            .map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                theme={theme}
                index={previewProducts.findIndex((item) => item.id === p.id)}
              />
            ))}
        </div>
      </section>
    </>
  );
}

function Assistance() {
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
          Per informazioni sul nuovo negozio,
          <br />
          contattaci direttamente.
        </p>
        <a
          href="https://wa.me/393519204546"
          target="_blank"
          rel="noreferrer"
          className="bp-button bp-button-outline"
        >
          Scrivici su WhatsApp <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function Footer({ theme }: { theme: Theme }) {
  return (
    <footer className="bp-footer">
      <div className="bp-container bp-footer-inner">
        <div className="bp-footer-brand">
          <div className="bp-footer-logo">
            <img
              src={`/images/boutique/mark-${theme === "scura" ? "dark" : "light"}.png`}
              alt=""
              loading="lazy"
            />
            <img
              src={`/images/boutique/wordmark-${theme === "scura" ? "dark" : "light"}.png`}
              alt="Interni Auto — Luxury Boutique, vendita di volanti e tappezzerie plurimarche"
              loading="lazy"
            />
          </div>
          <p>
            Volanti e tappezzerie plurimarche.
            <br />
            La tua auto, come nuova.
          </p>
        </div>
        <div>
          <p className="bp-eyebrow">LA BOUTIQUE</p>
          <Link to={pathFor(theme, "home")}>La nostra selezione</Link>
          <Link to={pathFor(theme, "catalogo")}>Il catalogo dimostrativo</Link>
          <p className="bp-footer-note">
            Solo spedizioni in Italia.
            <br />
            Nessun punto di ritiro.
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
          <a href="https://wa.me/393519204546" target="_blank" rel="noreferrer">
            <MessageCircle size={14} aria-hidden="true" />
            WhatsApp +39 351 920 4546
          </a>
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
        <span>Anteprima grafica · documenti legali non ancora pubblicati</span>
      </div>
    </footer>
  );
}

export default function BoutiquePreview() {
  const [location] = useLocation();
  const theme: Theme = location.includes("/chiara") ? "chiara" : "scura";
  const page: Page = location.includes("/prodotto/")
    ? "scheda"
    : location.endsWith("/catalogo")
      ? "catalogo"
      : "home";
  const id = location.split("/prodotto/")[1] ?? "cupra";
  const product = previewProducts.find((p) => p.id === id) ?? previewProducts[0];
  useEffect(() => {
    document.title = `${theme === "scura" ? "A · Boutique scura" : "B · Boutique chiara"} — Interni Auto | Anteprima`;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location, theme]);
  return (
    <div className={`bp-site bp-${theme}`}>
      <a href="#bp-content" className="bp-skip">
        Salta al contenuto
      </a>
      <PreviewBar theme={theme} page={page} product={product.id} />
      <Header theme={theme} page={page} />
      <main id="bp-content" tabIndex={-1}>
        {page === "catalogo" ? (
          <Catalog key={`${theme}-${window.location.search}`} theme={theme} />
        ) : page === "scheda" ? (
          <Product theme={theme} product={product} />
        ) : (
          <Home theme={theme} />
        )}
      </main>
      <Footer theme={theme} />
    </div>
  );
}
