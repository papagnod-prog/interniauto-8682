import { useMemo } from "react";
import { Link, useSearch } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { ArrowUpRight } from "lucide-react";
import { usePosts } from "../queries/blog";

const FILTERS = [
  { label: "Tutti", value: "" },
  { label: "Mondo Auto", value: "Mondo Auto" },
  { label: "Realizzazioni", value: "Realizzazioni" },
];

function BlogPage() {
  const search = useSearch();
  const active = useMemo(() => new URLSearchParams(search).get("categoria") ?? "", [search]);
  const posts = usePosts(active ? { category: active } : {});

  return (
    <>
      <section className="border-b border-line py-16 md:py-20">
        <div className="container-ia">
          <p className="eyebrow reveal">Blog</p>
          <h1 className="reveal delay-1 mt-4 text-[clamp(2.5rem,7vw,5rem)]">
            Consigli dalla <span className="text-leather">tappezzeria</span>
          </h1>
          <p className="reveal delay-2 mt-5 max-w-2xl text-muted">
            Materiali, manutenzione, restauri e lavori usciti dal nostro laboratorio di Corato.
          </p>
        </div>
      </section>

      <section className="container-ia py-12">
        <div className="mb-10 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => navigate(f.value ? `/blog?categoria=${encodeURIComponent(f.value)}` : "/blog")}
              className={`border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
                active === f.value
                  ? "border-leather bg-leather text-ink"
                  : "border-line text-muted hover:border-leather hover:text-leather"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {posts.isLoading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-3/2 animate-pulse bg-surface" />
            ))}
          </div>
        ) : posts.data?.length ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.data.map((post, i) => (
              <article
                key={post.id}
                className="group reveal"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <Link to={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-3/2 overflow-hidden bg-surface">
                    {post.cover && (
                      <img
                        src={post.cover}
                        alt={post.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                    <span className="absolute left-0 top-0 bg-ink/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-leather">
                      {post.category}
                    </span>
                  </div>
                </Link>
                <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-muted">
                  {new Date(post.publishedAt).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <Link to={`/blog/${post.slug}`}>
                  <h2 className="mt-2 text-lg leading-tight transition-colors group-hover:text-leather">
                    {post.title}
                  </h2>
                </Link>
                <p className="mt-3 line-clamp-3 text-sm text-muted">{post.excerpt}</p>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-leather"
                >
                  Leggi <ArrowUpRight className="size-3.5" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted">Nessun articolo in questa sezione.</p>
        )}
      </section>
    </>
  );
}

export default BlogPage;
