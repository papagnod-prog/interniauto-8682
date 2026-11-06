import { Link } from "wouter";
import { Award, Hammer, MessageCircle, Ruler, Scissors } from "lucide-react";
import { useShopInfo } from "../queries/catalog";

const STEPS = [
  {
    icon: MessageCircle,
    title: "1. Ci scrivi",
    text: "Mandi foto degli interni e il modello dell'auto su WhatsApp. Ti diciamo subito se il lavoro è fattibile.",
  },
  {
    icon: Ruler,
    title: "2. Rilievo e materiali",
    text: "Scegliamo insieme pelle, alcantara o tessuto tecnico, colore delle cuciture e finiture.",
  },
  {
    icon: Scissors,
    title: "3. Taglio e cucitura",
    text: "Ogni pezzo viene smontato, sfoderato e ricucito a mano nel laboratorio di Corato.",
  },
  {
    icon: Hammer,
    title: "4. Montaggio",
    text: "Rimontiamo tutto in sede e controlliamo tensioni e accoppiamenti prima della consegna.",
  },
];

const NUMBERS = [
  { value: "30+", label: "Anni di mestiere" },
  { value: "100%", label: "Fatto a mano in sede" },
  { value: "48h", label: "Preventivo via WhatsApp" },
];

function OfficinaPage() {
  const shop = useShopInfo();
  const waNumber = (shop.data?.whatsappPublic ?? "+39 345 49 58 428").replace(/\D/g, "");

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-ia grid gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-24">
          <div>
            <p className="eyebrow reveal">L'officina</p>
            <h1 className="reveal delay-1 mt-4 text-[clamp(2.5rem,7vw,5rem)]">
              Tappezzeria auto <span className="text-leather">artigianale</span>
            </h1>
            <div className="reveal delay-2 mt-6 space-y-4 text-muted">
              <p>
                Interni Auto Design nasce a Corato, in provincia di Bari, dall'esperienza di una
                famiglia che lavora pelle e tessuti da oltre trent'anni. Non produciamo in serie:
                ogni volante, cielo, sedile o pannello passa dalle nostre mani.
              </p>
              <p>
                Restauriamo interni consumati, personalizziamo auto nuove, rifacciamo selle moto e
                interni di auto d'epoca. Lavoriamo con pelle pieno fiore, alcantara, similpelle
                tecnica e tessuti spugnati, con cuciture a contrasto scelte dal cliente.
              </p>
              <p>
                Puoi portarci l'auto in sede oppure spedirci il pezzo da rivestire: volanti e
                pannelli viaggiano tranquillamente in corriere.
              </p>
            </div>
            <div className="reveal delay-3 mt-8 flex flex-wrap gap-3">
              <a
                className="btn-wa"
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Ciao, vorrei informazioni sui vostri lavori di tappezzeria auto.")}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="size-4" /> Parla con noi
              </a>
              <Link to="/catalogo" className="btn-ghost">
                Vedi il catalogo
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="reveal delay-4 aspect-4/5 overflow-hidden bg-surface">
              <img
                src="/images/blog/interni-auto.jpeg"
                alt="Interni auto rivestiti a mano"
                className="size-full object-cover"
              />
            </div>
            <div className="reveal delay-5 absolute -bottom-8 -left-6 hidden w-48 overflow-hidden border border-line bg-ink md:block">
              <img
                src="/images/blog/volante.jpeg"
                alt="Volante rivestito in pelle"
                className="aspect-square size-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line py-12">
        <div className="container-ia grid gap-8 sm:grid-cols-3">
          {NUMBERS.map((n) => (
            <div key={n.label} className="flex items-baseline gap-4">
              <span className="display text-[clamp(2.4rem,5vw,3.4rem)] text-leather">{n.value}</span>
              <span className="text-[12px] uppercase tracking-[0.2em] text-muted">{n.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container-ia">
          <p className="eyebrow">Come lavoriamo</p>
          <h2 className="mt-4 text-[clamp(1.9rem,4.5vw,3rem)]">Dal messaggio al montaggio</h2>
          <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.title} className="bg-ink p-7">
                <s.icon className="size-6 text-leather" />
                <h3 className="mt-5 text-base">{s.title}</h3>
                <p className="mt-3 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface/40 py-16">
        <div className="container-ia grid gap-10 md:grid-cols-2">
          <div>
            <Award className="size-6 text-leather" />
            <h2 className="mt-5 text-[clamp(1.6rem,3.5vw,2.4rem)]">Cosa realizziamo</h2>
            <ul className="mt-6 space-y-3 text-muted">
              <li>Rivestimento volanti in pelle e alcantara con cuciture a contrasto</li>
              <li>Rifacimento cieli e sottotetti scollati</li>
              <li>Sedili, pannelli porta, braccioli e cuffie cambio</li>
              <li>Tappezzeria completa per auto d'epoca e restauri</li>
              <li>Selle e sellini moto e scooter</li>
              <li>Cruscotti rivestiti e personalizzazioni su misura</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img
              src="/images/blog/sottotetto.jpeg"
              alt="Rifacimento cielo auto"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <img
              src="/images/blog/selleria-moto.jpg"
              alt="Selleria moto"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <img
              src="/images/blog/personalizzazione-interni.jpg"
              alt="Personalizzazione interni"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
            <img
              src="/images/blog/auto-depoca.jpg"
              alt="Tappezzeria auto d'epoca"
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default OfficinaPage;
