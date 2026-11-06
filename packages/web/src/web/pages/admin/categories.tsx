import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminHead, AdminLoading } from "../../components/admin-layout";
import { errorMessage } from "../../lib/format";
import { useAdminCategories, useRemoveCategory, useSaveCategory } from "../../queries/admin";

type Draft = { id?: number; name: string; description: string; visible: boolean; sortOrder: string };
const EMPTY: Draft = { name: "", description: "", visible: true, sortOrder: "0" };

export default function AdminCategoriesPage() {
  const list = useAdminCategories();
  const save = useSaveCategory();
  const remove = useRemoveCategory();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<number | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const sortOrder = Number.parseInt(draft.sortOrder || "0", 10);
    if (draft.name.trim().length < 2) return setError("Inserisci un nome di almeno 2 caratteri.");
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999) return setError("Ordine tra 0 e 999.");
    try {
      await save.mutateAsync({
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        description: draft.description.trim(),
        visible: draft.visible,
        sortOrder,
      });
      setNotice(draft.id ? "Categoria aggiornata." : "Categoria creata.");
      setDraft(EMPTY);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const destroy = async (id: number, name: string) => {
    if (!window.confirm(`Eliminare la categoria "${name}"?`)) return;
    setError("");
    setNotice("");
    setRemoving(id);
    try {
      await remove.mutateAsync({ id });
      if (draft.id === id) setDraft(EMPTY);
      setNotice("Categoria eliminata.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <AdminHead
        eyebrow="CATALOGO"
        title="Categorie"
        text="Le categorie visibili compaiono come filtri nel catalogo. Una categoria con prodotti non si può eliminare."
      />

      <div className="bp-panel-grid" style={{ alignItems: "start" }}>
        <section className="bp-panel" aria-labelledby="cat-list">
          <h2 id="cat-list">Elenco</h2>
          <p>Ordine crescente: 0 viene prima.</p>
          {list.isLoading ? (
            <AdminLoading />
          ) : list.isError ? (
            <p className="bp-error">{errorMessage(list.error)}</p>
          ) : !list.data?.length ? (
            <p className="bp-detail-bottom-note">Nessuna categoria. Crea la prima, ad esempio “Volanti” o “Tappezzerie”.</p>
          ) : (
            <ul className="bp-checklist">
              {list.data.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {Number(c.products)} prodotti · ordine {c.sortOrder} · /catalogo?categoria={c.slug}
                    </small>
                  </div>
                  <div className="bp-actions" style={{ gap: 8 }}>
                    <span className={`bp-status ${c.visible ? "is-ok" : ""}`}>{c.visible ? "Visibile" : "Nascosta"}</span>
                    <button
                      type="button"
                      className="bp-icon-button"
                      aria-label={`Modifica ${c.name}`}
                      onClick={() => {
                        setError("");
                        setNotice("");
                        setDraft({
                          id: c.id,
                          name: c.name,
                          description: c.description ?? "",
                          visible: c.visible,
                          sortOrder: String(c.sortOrder),
                        });
                      }}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="bp-icon-button"
                      aria-label={`Elimina ${c.name}`}
                      disabled={removing === c.id}
                      onClick={() => destroy(c.id, c.name)}
                    >
                      {removing === c.id ? (
                        <Loader2 size={14} className="bp-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 size={14} aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bp-panel" aria-labelledby="cat-form">
          <h2 id="cat-form">{draft.id ? "Modifica categoria" : "Nuova categoria"}</h2>
          <p>{draft.id ? "Il link della categoria resta invariato." : "Il link viene generato dal nome."}</p>
          <form onSubmit={submit} className="bp-form-grid" noValidate>
            <label className="bp-field bp-span-4" htmlFor="cat-name">
              <span>Nome *</span>
              <input aria-label="Nome"
                id="cat-name"
                className="bp-input"
                value={draft.name}
                maxLength={60}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label className="bp-field bp-span-2" htmlFor="cat-order">
              <span>Ordine</span>
              <input aria-label="Ordine"
                id="cat-order"
                className="bp-input"
                type="number"
                min={0}
                max={999}
                value={draft.sortOrder}
                onChange={(e) => setDraft({ ...draft, sortOrder: e.target.value })}
              />
            </label>
            <label className="bp-field bp-span-6" htmlFor="cat-desc">
              <span>Descrizione breve</span>
              <textarea aria-label="Descrizione breve"
                id="cat-desc"
                className="bp-input"
                rows={3}
                maxLength={400}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label className="bp-check bp-span-6">
              <input
                aria-label="Visibile nel catalogo"
                type="checkbox"
                checked={draft.visible}
                onChange={(e) => setDraft({ ...draft, visible: e.target.checked })}
              />
              Visibile nel catalogo
            </label>
            <div className="bp-span-6 bp-actions" style={{ gap: 10 }}>
              <button type="submit" className="bp-button bp-button-small" disabled={save.isPending}>
                {save.isPending ? (
                  <Loader2 size={14} className="bp-spin" aria-hidden="true" />
                ) : (
                  <Plus size={14} aria-hidden="true" />
                )}
                {draft.id ? "Salva modifiche" : "Crea categoria"}
              </button>
              {draft.id && (
                <button type="button" className="bp-button bp-button-outline bp-button-small" onClick={() => setDraft(EMPTY)}>
                  Annulla
                </button>
              )}
            </div>
            {(error || notice) && (
              <p className={`bp-span-6 ${error ? "bp-error" : "bp-success"}`} role={error ? "alert" : "status"}>
                {error || notice}
              </p>
            )}
          </form>
        </section>
      </div>
    </>
  );
}
