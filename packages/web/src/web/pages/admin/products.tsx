import { useState } from "react";
import { Link } from "wouter";
import { Archive, ImageOff, Plus } from "lucide-react";
import { AdminHead, AdminLoading } from "../../components/admin-layout";
import { dateTime, errorMessage, euro } from "../../lib/format";
import { useAdminProducts } from "../../queries/admin";

const STATUS: Record<string, { label: string; tone: string }> = {
  published: { label: "Pubblicato", tone: "is-ok" },
  draft: { label: "Bozza", tone: "is-warn" },
  archived: { label: "Archiviato", tone: "" },
};

export default function AdminProductsPage() {
  const [scope, setScope] = useState<"current" | "legacy">("current");
  const list = useAdminProducts(scope);

  return (
    <>
      <AdminHead
        eyebrow="CATALOGO"
        title="Prodotti"
        text="Volanti e tappezzerie in vendita. Un prodotto è visibile solo se pubblicato, con prezzo, foto e categoria."
      >
        <Link to="/admin/prodotti/nuovo" className="bp-button bp-button-small">
          <Plus size={16} aria-hidden="true" /> Nuovo prodotto
        </Link>
      </AdminHead>

      <div className="bp-tabs" role="tablist" aria-label="Elenco prodotti">
        <button
          type="button"
          role="tab"
          aria-selected={scope === "current"}
          className={scope === "current" ? "is-active" : ""}
          onClick={() => setScope("current")}
        >
          Catalogo attuale
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={scope === "legacy"}
          className={scope === "legacy" ? "is-active" : ""}
          onClick={() => setScope("legacy")}
        >
          Archivio vecchio sito
        </button>
      </div>

      {scope === "legacy" && (
        <div className="bp-callout" style={{ marginBottom: 20 }}>
          <Archive size={16} aria-hidden="true" />
          <p>
            <strong>Sola lettura.</strong> Prodotti e prezzi del vecchio sito, conservati come archivio. Non sono
            visibili nel negozio e non si possono modificare né rimettere in vendita da qui.
          </p>
        </div>
      )}

      {list.isLoading ? (
        <AdminLoading />
      ) : list.isError ? (
        <p className="bp-error">{errorMessage(list.error)}</p>
      ) : !list.data?.length ? (
        <div className="bp-empty-panel">
          <p className="bp-eyebrow">{scope === "current" ? "NESSUN PRODOTTO" : "ARCHIVIO VUOTO"}</p>
          <h2>{scope === "current" ? "Il catalogo è vuoto" : "Nessun prodotto archiviato"}</h2>
          {scope === "current" && (
            <>
              <p>Crea il primo prodotto: nome, foto, prezzo, giacenza e categoria.</p>
              <Link to="/admin/prodotti/nuovo" className="bp-button bp-button-small">
                <Plus size={16} aria-hidden="true" /> Nuovo prodotto
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="bp-table-wrap">
          <table className="bp-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="bp-sr-only">Foto</span>
                </th>
                <th scope="col">Prodotto</th>
                <th scope="col">Categorie</th>
                <th scope="col">Stato</th>
                <th scope="col" className="bp-num">
                  Giacenza
                </th>
                <th scope="col" className="bp-num">
                  Prezzo
                </th>
                <th scope="col">Aggiornato</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((p) => {
                const status = STATUS[p.status] ?? { label: p.status, tone: "" };
                return (
                  <tr key={p.id}>
                    <td>
                      {p.image ? (
                        <img className="bp-thumb" src={p.image} alt="" loading="lazy" />
                      ) : (
                        <span className="bp-thumb-empty">
                          <ImageOff size={14} aria-hidden="true" />
                        </span>
                      )}
                    </td>
                    <td>
                      {p.legacy ? (
                        <strong>{p.name}</strong>
                      ) : (
                        <Link to={`/admin/prodotti/${p.id}`}>
                          <strong>{p.name}</strong>
                        </Link>
                      )}
                      <br />
                      <small style={{ color: "var(--bp-muted)" }}>
                        {[p.brand, `${p.imageCount} foto`, p.featured ? "In vetrina" : ""].filter(Boolean).join(" · ")}
                      </small>
                    </td>
                    <td>{p.categories.join(", ") || "—"}</td>
                    <td>
                      <span className={`bp-status ${p.legacy ? "" : status.tone}`}>
                        {p.legacy ? "Archivio" : status.label}
                      </span>
                    </td>
                    <td className="bp-num">{p.legacy ? "—" : p.stock}</td>
                    <td className="bp-num">{euro(p.priceCents)}</td>
                    <td>{dateTime(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
