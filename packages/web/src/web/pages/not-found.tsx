import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useDocumentTitle } from "../components/site-layout";

/**
 * 404 lato client: il server (template) risponde 200 a ogni rotta SPA, quindi la
 * pagina dichiara noindex nel documento (già presente in index.html finché il sito
 * non viene pubblicato).
 */
export default function NotFoundPage({ what = "pagina" }: { what?: string }) {
  useDocumentTitle("Pagina non trovata");
  return (
    <section className="bp-container bp-not-found">
      <p className="bp-eyebrow">ERRORE 404</p>
      <h1>
        Questa {what}
        <br />
        <em>non esiste.</em>
      </h1>
      <p>Il link potrebbe essere errato o l'articolo non è più disponibile.</p>
      <div className="bp-actions">
        <Link to="/catalogo" className="bp-button">
          Vai al catalogo <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link to="/" className="bp-text-link">
          Torna alla boutique
        </Link>
      </div>
    </section>
  );
}
