import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useShopInfo } from "../queries/catalog";

function ContattiPage() {
  const shop = useShopInfo();
  const data = shop.data;
  const waNumber = (data?.whatsappPublic ?? "+39 345 49 58 428").replace(/\D/g, "");
  const phone = data?.phone ?? "+39 333 35 62 836";

  return (
    <>
      <section className="border-b border-line py-16 md:py-20">
        <div className="container-ia">
          <p className="eyebrow reveal">Contatti</p>
          <h1 className="reveal delay-1 mt-4 text-[clamp(2.5rem,7vw,5rem)]">
            Passa in <span className="text-leather">officina</span>
          </h1>
          <p className="reveal delay-2 mt-5 max-w-2xl text-muted">
            Siamo a Corato, in provincia di Bari. Per un preventivo veloce manda una foto degli
            interni su WhatsApp: rispondiamo in giornata negli orari di apertura.
          </p>
        </div>
      </section>

      <section className="container-ia grid gap-12 py-14 md:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-8">
          <div className="reveal">
            <p className="eyebrow">Sede</p>
            <p className="mt-3 flex items-start gap-3 text-lg">
              <MapPin className="mt-1 size-5 shrink-0 text-leather" />
              {data?.address ?? "Via Brindisi 26/28, 70033 Corato (BA)"}
            </p>
          </div>

          <div className="reveal delay-1">
            <p className="eyebrow">Telefono</p>
            <a
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="mt-3 flex items-center gap-3 text-lg transition-colors hover:text-leather"
            >
              <Phone className="size-5 shrink-0 text-leather" />
              {phone}
            </a>
          </div>

          <div className="reveal delay-2">
            <p className="eyebrow">WhatsApp</p>
            <a
              href={`https://wa.me/${waNumber}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center gap-3 text-lg transition-colors hover:text-wa"
            >
              <MessageCircle className="size-5 shrink-0 text-wa" />
              {data?.whatsappPublic ?? "+39 345 49 58 428"}
            </a>
          </div>

          <div className="reveal delay-3">
            <p className="eyebrow">Email</p>
            <a
              href={`mailto:${data?.email ?? "info@interniautodesign.it"}`}
              className="mt-3 flex items-center gap-3 text-lg transition-colors hover:text-leather"
            >
              <Mail className="size-5 shrink-0 text-leather" />
              {data?.email ?? "info@interniautodesign.it"}
            </a>
          </div>

          <div className="reveal delay-4">
            <p className="eyebrow">Orari</p>
            <ul className="mt-3 space-y-1.5 text-muted">
              {(data?.hours ?? [
                "Lunedì – Venerdì: 08:00–13:00 / 15:00–19:00",
                "Sabato: 08:00–13:00",
                "Domenica: chiuso",
              ]).map((h) => (
                <li key={h} className="flex items-center gap-3">
                  <Clock className="size-4 shrink-0 text-leather" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="hairline pt-6 text-sm text-muted">
            P.IVA {data?.vat ?? "07166400726"}
          </div>

          <a
            className="btn-wa reveal delay-5"
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Ciao, vorrei informazioni su un lavoro di tappezzeria auto.")}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" /> Scrivici su WhatsApp
          </a>
        </div>

        <div className="reveal delay-3 min-h-[420px] border border-line">
          <iframe
            title="Mappa Interni Auto Design, Corato"
            src="https://www.google.com/maps?q=Via%20Brindisi%2026%2C%2070033%20Corato%20BA&output=embed"
            className="size-full min-h-[420px] grayscale-[35%]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>
    </>
  );
}

export default ContattiPage;
