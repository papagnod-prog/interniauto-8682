import { Link, useParams } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { usePost } from "../queries/blog";
import { useShopInfo } from "../queries/catalog";

function ArticoloPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const post = usePost(slug);
  const shop = useShopInfo();

  if (post.isLoading) {
    return (
      <div className="container-ia py-24">
        <div className="h-8 w-2/3 animate-pulse bg-surface" />
        <div className="mt-6 aspect-16/9 animate-pulse bg-surface" />
      </div>
    );
  }

  if (post.isError || !post.data) {
    return (
      <div className="container-ia py-32 text-center">
        <h1 className="text-4xl">Articolo non trovato</h1>
        <Link to="/blog" className="btn-ghost mt-8">
          Torna al blog
        </Link>
      </div>
    );
  }

  const { post: article, related } = post.data;
  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const waNumber = (shop.data?.whatsappPublic ?? "+39 345 49 58 428").replace(/\D/g, "");

  return (
    <>
      <article className="py-14 md:py-20">
        <div className="container-ia max-w-3xl">
          <Link
            to="/blog"
            className="reveal inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted hover:text-leather"
          >
            <ArrowLeft className="size-3.5" /> Blog
          </Link>

          <p className="eyebrow reveal delay-1 mt-8">{article.category}</p>
          <h1 className="reveal delay-2 mt-4 text-[clamp(2rem,5.5vw,3.6rem)]">{article.title}</h1>
          <p className="reveal delay-3 mt-4 text-[12px] uppercase tracking-[0.2em] text-muted">
            {new Date(article.publishedAt).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {article.cover && (
          <div className="container-ia mt-10 max-w-5xl">
            <div className="reveal delay-4 aspect-16/9 overflow-hidden bg-surface">
              <img src={article.cover} alt={article.title} className="size-full object-cover" />
            </div>
          </div>
        )}

        <div className="container-ia mt-12 max-w-3xl">
          <div className="space-y-5 text-[17px] leading-relaxed text-stitch/85">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="stitch-line mt-14 pt-8">
            <p className="text-muted">
              Hai un progetto simile in mente? Scrivici su WhatsApp: ti diciamo materiali, tempi e
              costo senza impegno.
            </p>
            <a
              className="btn-wa mt-6"
              href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Ciao, ho letto l'articolo "${article.title}" sul vostro sito e vorrei qualche informazione.`)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="size-4" /> Scrivi su WhatsApp
            </a>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line py-16">
          <div className="container-ia">
            <p className="eyebrow">Continua a leggere</p>
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="group block">
                  <div className="aspect-3/2 overflow-hidden bg-surface">
                    {r.cover && (
                      <img
                        src={r.cover}
                        alt={r.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <h3 className="mt-4 text-base leading-tight transition-colors group-hover:text-leather">
                    {r.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default ArticoloPage;
