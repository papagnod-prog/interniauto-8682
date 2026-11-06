import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Clock, Mail, MapPin, Menu, Phone, ShoppingBag, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { useShopInfo } from "../queries/catalog";
import { CartDrawer } from "./cart-drawer";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Catalogo", href: "/catalogo" },
  { label: "Realizzazioni", href: "/realizzazioni" },
  { label: "Officina", href: "/officina" },
  { label: "Blog", href: "/blog" },
  { label: "Contatti", href: "/contatti" },
];

function TopBar() {
  const shop = useShopInfo();
  return (
    <div className="hidden border-b border-line bg-ink-deep py-2 text-[12px] text-muted md:block">
      <div className="container-ia flex items-center justify-between gap-6">
        <span className="flex items-center gap-2">
          <MapPin className="size-3.5 text-leather" />
          {shop.data?.address ?? "Via Brindisi 26/28, Corato (BA)"}
        </span>
        <div className="flex items-center gap-6">
          <a className="flex items-center gap-2 hover:text-stitch" href={`tel:${(shop.data?.phone ?? "").replace(/\s/g, "")}`}>
            <Phone className="size-3.5 text-leather" />
            {shop.data?.phone ?? "+39 333 35 62 836"}
          </a>
          <a className="flex items-center gap-2 hover:text-stitch" href={`mailto:${shop.data?.email ?? ""}`}>
            <Mail className="size-3.5 text-leather" />
            {shop.data?.email ?? "info@interniautodesign.it"}
          </a>
          <span className="flex items-center gap-2">
            <Clock className="size-3.5 text-leather" />
            Lun–Ven 8–13 / 15–19
          </span>
        </div>
      </div>
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { count, setOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  return (
    <header className="sticky top-0 z-50">
      <TopBar />
      <div
        className={`transition-colors duration-300 ${
          scrolled ? "border-b border-line bg-ink/95 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="container-ia flex h-[68px] items-center justify-between gap-6">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
            aria-label="Interni Auto Design — home"
          >
            <img
              src="/images/brand/logo-mark-dark.png"
              alt=""
              className="hidden h-9 w-auto shrink-0 sm:block md:h-10"
            />
            <img
              src="/images/brand/logo-lockup-dark.png"
              alt="Interni Auto Design"
              className="h-6 w-auto sm:h-7 md:h-8"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => {
              const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-[12px] font-bold uppercase tracking-[0.18em] transition-colors ${
                    active ? "text-leather" : "text-muted hover:text-stitch"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative flex size-10 items-center justify-center border border-line transition-colors hover:border-leather"
              aria-label="Apri carrello"
            >
              <ShoppingBag className="size-4" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-leather text-[11px] font-bold text-ink">
                  {count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex size-10 items-center justify-center border border-line lg:hidden"
              aria-label="Menu"
            >
              {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-b border-line bg-ink lg:hidden">
          <nav className="container-ia flex flex-col py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="border-b border-line py-3 text-[13px] font-bold uppercase tracking-[0.18em] text-muted last:border-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const shop = useShopInfo();
  const wa = shop.data?.whatsappOrders ?? "393381464613";
  return (
    <footer className="mt-24 border-t border-line bg-ink-deep">
      <div className="container-ia grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <img
            src="/images/brand/logo-full-dark.png"
            alt="Interni Auto Design — tappezzeria auto"
            className="w-full max-w-[320px]"
          />
          <p className="mt-6 max-w-sm text-sm text-muted">
            Tappezzeria auto artigianale a Corato. Trent'anni di mestiere tra pelle, cuciture e
            interni su misura: volanti, sedili, cieli, selleria moto e restauro auto d'epoca.
          </p>
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="btn-wa mt-6"
          >
            Scrivici su WhatsApp
          </a>
        </div>

        <div>
          <p className="eyebrow">Naviga</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="hover:text-leather">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow">Sede e orari</p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li>{shop.data?.address ?? "Via Brindisi 26/28, 70033 Corato (BA)"}</li>
            <li>
              <a href={`tel:${(shop.data?.phone ?? "").replace(/\s/g, "")}`} className="hover:text-leather">
                {shop.data?.phone ?? "+39 333 35 62 836"}
              </a>
            </li>
            <li>
              <a href={`mailto:${shop.data?.email}`} className="hover:text-leather">
                {shop.data?.email ?? "info@interniautodesign.it"}
              </a>
            </li>
            {(shop.data?.hours ?? []).map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hairline">
        <div className="container-ia flex flex-col gap-2 py-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Faretra Antonia — P.IVA {shop.data?.vat ?? "07166400726"}</span>
          <span>Interni Auto Design — tutti i diritti riservati</span>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);

  return (
    <div className="min-h-screen bg-ink">
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
