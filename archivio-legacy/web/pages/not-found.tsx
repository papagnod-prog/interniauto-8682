import { Link } from "wouter";

function NotFoundPage() {
  return (
    <section className="container-ia flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow reveal">Errore 404</p>
      <h1 className="reveal delay-1 mt-4 text-[clamp(3rem,12vw,8rem)] text-leather">Fuori strada</h1>
      <p className="reveal delay-2 mt-4 max-w-md text-muted">
        La pagina che cerchi non esiste o è stata spostata. Torna al catalogo o scrivici: troviamo
        noi il pezzo giusto.
      </p>
      <div className="reveal delay-3 mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/catalogo" className="btn-primary">
          Vai al catalogo
        </Link>
        <Link to="/contatti" className="btn-ghost">
          Contatti
        </Link>
      </div>
    </section>
  );
}

export default NotFoundPage;
