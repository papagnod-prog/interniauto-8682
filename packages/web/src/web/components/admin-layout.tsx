import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FolderTree, LayoutDashboard, Loader2, LogOut, Package, Receipt, Settings } from "lucide-react";
import { signOut } from "../lib/auth";
import { useAdminMe } from "../queries/admin";

const NAV = [
  { to: "/admin", label: "Panoramica", icon: LayoutDashboard },
  { to: "/admin/prodotti", label: "Prodotti", icon: Package },
  { to: "/admin/categorie", label: "Categorie", icon: FolderTree },
  { to: "/admin/ordini", label: "Ordini", icon: Receipt },
  { to: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const me = useAdminMe();
  const qc = useQueryClient();
  const status = (me.error as { status?: number } | null)?.status;

  useEffect(() => {
    document.title = "Dashboard · Interni Auto";
  }, []);
  useEffect(() => {
    if (status === 401 || status === 403) navigate("/admin/login", { replace: true });
  }, [status, navigate]);

  if (me.isLoading || status === 401 || status === 403) {
    return (
      <div className="bp-site">
        <div className="bp-loading" style={{ minHeight: "100vh" }}>
          <Loader2 className="bp-spin" aria-label="Verifica accesso" />
        </div>
      </div>
    );
  }
  if (me.isError) {
    return (
      <div className="bp-site">
        <div className="bp-loading" style={{ minHeight: "100vh" }}>
          <p className="bp-error">Dashboard non raggiungibile. Ricarica la pagina.</p>
        </div>
      </div>
    );
  }

  const logout = async () => {
    await signOut();
    qc.clear();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="bp-site">
      <div className="bp-admin">
        <aside className="bp-admin-side">
          <Link to="/admin" aria-label="Dashboard">
            <img className="bp-wordmark" src="/images/boutique/wordmark-dark.png" alt="Interni Auto — Dashboard" />
          </Link>
          <nav className="bp-admin-nav" aria-label="Dashboard">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/admin" ? location === "/admin" : location.startsWith(to);
              return (
                <Link key={to} to={to} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
                  <Icon size={16} aria-hidden="true" /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="bp-admin-foot">
            <span className="bp-admin-email">{me.data?.email}</span>
            <a href="/" target="_blank" rel="noreferrer">
              <ExternalLink size={14} aria-hidden="true" /> Vedi il negozio
            </a>
            <button type="button" onClick={logout}>
              <LogOut size={14} aria-hidden="true" /> Esci
            </button>
          </div>
        </aside>
        <main className="bp-admin-main" id="contenuto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminHead({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  text?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bp-admin-head">
      <div>
        <p className="bp-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children && <div className="bp-actions">{children}</div>}
    </div>
  );
}

export function AdminLoading() {
  return (
    <div className="bp-loading">
      <Loader2 className="bp-spin" aria-label="Caricamento" />
    </div>
  );
}
