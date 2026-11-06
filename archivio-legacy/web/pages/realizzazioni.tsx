import { Link } from "wouter";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { usePosts } from "../queries/blog";
import { useProducts, useShopInfo } from "../queries/catalog";

function RealizzazioniPage() {
  const posts = usePosts({ category: "Realizzazioni" });
  const products = useProducts({});
  const shop = useShopInfo();
  const waNumber = (shop.data?.whatsappPublic ?? "+39 345 49 58 428").replace(/\D/g, "");

  const gallery = (products.data ?? []).flatMap((p) =>
    p.images.slice(0, 2).map((img) => ({ img, name: p.name, slug: p.slug })),
  );

  return (
    <>
      <section className="border-b border-line py-16 md:py-20">
        <div className="container-ia">
          <p className="eyebrow reveal">Portfolio</p>
          <h1 className="reveal delay-1 mt-4 text-[clamp(2.5rem,7vw,5rem)]">
            Lavori usciti dal <span className="text-leather">laboratorio</span>
          </h1>
          <p className="reveal delay-2 mt-5 max-w-2xl text-muted">
            Volanti rivestiti a mano, cieli rifatti, sedili e pannelli su misura. Ogni pezzo è
            tagliato, cucito e montato nella nostra officina di Corato.
          </p>
        </div>
      </section>

      <section className="container-ia py-14">
        {products.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square animate-pulse bg-surface" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((g, i) => (
              <Link
                key={`${g.slug}-${i}`}
                to={`/prodotti/${g.slug}`}
                className="group relative block aspect-square overflow-hidden bg-surface"
              >
                <img
                  src={g.img}
                  alt={g.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 flex items-end bg-linear-to-t from-ink/90 via-ink/10 to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-leather">
                    {g.name} <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {(posts.data?.length ?? 0) > 0 && (
        <section className="border-t border-line py-16">
          <div className="container-ia">
            <p className="eyebrow">Dietro le quinte</p>
            <h2 className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)]">Le storie dei lavori</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {posts.data?.slice(0, 6).map((p) => (
                <Link key={p.id} to={`/blog/${p.slug}`} className="group block">
                  <div className="aspect-3/2 overflow-hidden bg-surface">
                    {p.cover && (
                      <img
                        src={p.cover}
                        alt={p.title}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <h3 className="mt-4 text-base leading-tight transition-colors group-hover:text-leather">
                    {p.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-line bg-surface/40 py-16">
        <div className="container-ia flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)]">Vuoi un lavoro su misura?</h2>
            <p className="mt-3 max-w-xl text-muted">
              Mandaci una foto dei tuoi interni: ti rispondiamo con materiali, tempi e preventivo.
            </p>
          </div>
          <a
            className="btn-wa"
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Ciao, vorrei un preventivo per un lavoro su misura sui miei interni auto.")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" /> Chiedi preventivo
          </a>
        </div>
      </section>
    </>
  );
}

export default RealizzazioniPage;
