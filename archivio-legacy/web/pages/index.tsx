import { Link } from "wouter";
import { ArrowRight, Award, Hammer, MessageCircle, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "../components/product-card";
import { useCategories, useProducts, useShopInfo } from "../queries/catalog";
import { usePosts } from "../queries/blog";

const SERVICES = [
  {
    title: "Volanti in pelle",
    text: "Rigenerazione e rivestimento di volanti di ogni casa automobilistica, riportati allo stato originale.",
    icon: Sparkles,
  },
  {
    title: "Tappezzeria completa",
    text: "Sedili anteriori, posteriori e pannelli porta rifatti su misura in pelle o tessuto tecnico.",
    icon: Hammer,
  },
  {
    title: "Cielo auto e sottotetto",
    text: "Sostituzione del rivestimento del tettuccio quando la colla cede e si formano rigonfiamenti.",
    icon: Truck,
  },
  {
    title: "Auto d'epoca e selleria moto",
    text: "Restauro conservativo di interni storici e rivestimenti sella con ricami e trapuntature.",
    icon: Award,
  },
];

function Hero() {
  const shop = useShopInfo();
  const wa = shop.data?.whatsappOrders ?? "393381464613";

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        className="pointer-events-none absolute -right-40 -top-40 size-[620px] rounded-full opacity-40 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.52 0.11 55 / 60%), transparent 70%)" }}
      />
      <div className="container-ia grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="eyebrow reveal">Corato (BA) — dal 1994</p>
          <h1 className="reveal delay-1 mt-5 text-[clamp(3rem,9vw,7rem)]">
            Ci prendiamo cura
            <br />
            della <span className="text-leather">tua auto</span>
          </h1>
          <p className="reveal delay-2 mt-7 max-w-xl text-lg text-muted">
            Tappezzeria artigianale: pelle vera cucita a mano, volanti rigenerati, interni su misura.
            Scegli dal catalogo e concludi l'ordine in due minuti su WhatsApp, con il link di
            pagamento già pronto.
          </p>
          <div className="reveal delay-3 mt-9 flex flex-wrap gap-3">
            <Link to="/catalogo" className="btn-primary">
              Vedi il catalogo <ArrowRight className="size-4" />
            </Link>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn-wa">
              <MessageCircle className="size-4" /> Chiedi un preventivo
            </a>
          </div>
          <div className="reveal delay-4 mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              ["30+", "anni di mestiere"],
              ["100%", "lavorazione a mano"],
              ["48h", "risposta preventivi"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl text-leather">{n}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal delay-2 relative lg:col-span-5">
          <div className="relative aspect-4/5 overflow-hidden">
            <img
              src="/images/blog/interni-auto.jpeg"
              alt="Interni auto rivestiti in pelle"
              className="size-full object-cover"
            />
          </div>
          <div className="absolute -bottom-8 -left-8 hidden w-56 border border-line bg-ink-deep p-5 md:block">
            <p className="eyebrow">Officina</p>
            <p className="mt-2 text-sm text-muted">
              Via Brindisi 26/28, Corato — lavorazioni su appuntamento
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ n, title, link }: { n: string; title: string; link?: { to: string; label: string } }) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <p className="eyebrow">{n}</p>
        <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)]">{title}</h2>
      </div>
      {link && (
        <Link to={link.to} className="group flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-muted hover:text-leather">
          {link.label}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function Categories() {
  const categories = useCategories();

  return (
    <section className="container-ia py-20 md:py-28">
      <SectionTitle n="01 — Categorie" title="Cosa realizziamo" link={{ to: "/catalogo", label: "Tutto il catalogo" }} />
      {categories.isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-3/2 animate-pulse bg-surface" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {categories.data?.map((c, i) => (
            <Link
              key={c.id}
              to={`/catalogo?categoria=${c.slug}`}
              className="group reveal relative aspect-3/2 overflow-hidden bg-surface"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              {c.image && (
                <img
                  src={c.image}
                  alt={c.name}
                  className="size-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-2xl">{c.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-leather">
                  {c.count} {c.count === 1 ? "articolo" : "articoli"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Featured() {
  const products = useProducts();

  return (
    <section className="border-y border-line bg-ink-deep py-20 md:py-28">
      <div className="container-ia">
        <SectionTitle n="02 — Catalogo" title="Gamma prodotti" link={{ to: "/catalogo", label: "Vedi tutti" }} />
        {products.isLoading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-4/5 animate-pulse bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {products.data?.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="container-ia grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
      <div className="relative lg:col-span-5">
        <img
          src="/images/blog/auto-depoca.jpg"
          alt="Restauro interni auto d'epoca"
          className="aspect-4/5 w-full object-cover"
        />
        <div className="stitch-line absolute inset-x-6 bottom-6" />
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <p className="eyebrow">03 — La nostra storia</p>
        <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)]">
          Vivere per <span className="text-leather">le piccole cose</span>
        </h2>
        <p className="mt-6 text-muted">
          Interni Auto nasce dall'esperienza trentennale di un ragazzo che, dopo aver lasciato gli
          studi, si dedicò al lavoro in una piccola bottega di tappezzeria. Da lì il mestiere è
          diventato metodo: taglio, cucitura, montaggio, controllo del dettaglio.
        </p>
        <p className="mt-4 text-muted">
          Oggi lavoriamo su auto quotidiane, veicoli commerciali, moto e auto d'epoca. Ogni interno
          viene realizzato su misura, con pellami selezionati e cuciture eseguite a mano, perché
          l'abitacolo torni ad essere un posto in cui stare bene.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/officina" className="btn-ghost">
            Scopri l'officina
          </Link>
          <Link to="/realizzazioni" className="btn-primary">
            Le realizzazioni <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="border-y border-line bg-ink-deep py-20 md:py-28">
      <div className="container-ia">
        <SectionTitle n="04 — Servizi" title="Lavorazioni su misura" />
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <div
              key={s.title}
              className="reveal group bg-ink-deep p-8 transition-colors hover:bg-ink"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <s.icon className="size-6 text-leather" />
              <h3 className="mt-5 text-lg">{s.title}</h3>
              <p className="mt-3 text-sm text-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LatestPosts() {
  const posts = usePosts({ limit: 3 });

  return (
    <section className="container-ia py-20 md:py-28">
      <SectionTitle n="05 — Blog" title="Mondo auto" link={{ to: "/blog", label: "Tutti gli articoli" }} />
      <div className="grid gap-8 md:grid-cols-3">
        {posts.isLoading
          ? [0, 1, 2].map((i) => <div key={i} className="aspect-3/2 animate-pulse bg-surface" />)
          : posts.data?.map((post, i) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group reveal"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="aspect-3/2 overflow-hidden bg-surface">
                  {post.cover && (
                    <img
                      src={post.cover}
                      alt={post.title}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <p className="eyebrow mt-4">{post.category}</p>
                <h3 className="mt-2 text-lg leading-tight transition-colors group-hover:text-leather">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted">{post.excerpt}</p>
              </Link>
            ))}
      </div>
    </section>
  );
}

function CtaWhatsApp() {
  const shop = useShopInfo();
  const wa = shop.data?.whatsappOrders ?? "393381464613";

  return (
    <section className="container-ia">
      <div className="grain relative overflow-hidden border border-line bg-surface px-8 py-16 text-center md:px-16">
        <p className="eyebrow relative z-10">Ordina in due minuti</p>
        <h2 className="relative z-10 mx-auto mt-4 max-w-3xl text-[clamp(1.9rem,4vw,3rem)]">
          Scegli l'articolo, il resto lo chiudiamo su WhatsApp
        </h2>
        <p className="relative z-10 mx-auto mt-5 max-w-xl text-muted">
          Ricevi il riepilogo dell'ordine con il link di pagamento con carta, oppure paghi con
          bonifico o in contanti al ritiro in officina.
        </p>
        <a
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          className="btn-wa relative z-10 mt-8"
        >
          <MessageCircle className="size-4" /> Scrivici ora
        </a>
      </div>
    </section>
  );
}

function Index() {
  return (
    <>
      <Hero />
      <Categories />
      <Featured />
      <Story />
      <Services />
      <LatestPosts />
      <CtaWhatsApp />
    </>
  );
}

export default Index;
