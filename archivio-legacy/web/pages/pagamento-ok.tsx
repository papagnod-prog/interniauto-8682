import { useMemo } from "react";
import { Link, useSearch } from "wouter";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useOrder } from "../queries/orders";
import { useShopInfo } from "../queries/catalog";
import { formatEuro } from "../lib/cart";

function PagamentoOkPage() {
  const search = useSearch();
  const code = useMemo(() => new URLSearchParams(search).get("ordine") ?? "", [search]);
  const order = useOrder(code);
  const shop = useShopInfo();
  const waNumber = (shop.data?.whatsappOrders ?? "393381464613").replace(/\D/g, "");

  return (
    <section className="container-ia flex min-h-[70vh] items-center py-20">
      <div className="mx-auto w-full max-w-xl text-center">
        <CheckCircle2 className="reveal mx-auto size-14 text-wa" />
        <h1 className="reveal delay-1 mt-8 text-[clamp(2rem,5vw,3.2rem)]">Pagamento ricevuto</h1>
        <p className="reveal delay-2 mt-4 text-muted">
          Grazie! Abbiamo registrato il pagamento. Prepariamo l'ordine e ti aggiorniamo su WhatsApp.
        </p>

        <div className="reveal delay-3 mt-10 border border-line bg-surface/40 p-7 text-left">
          {order.isLoading && code ? (
            <div className="space-y-3">
              <div className="h-4 w-1/2 animate-pulse bg-surface" />
              <div className="h-4 w-1/3 animate-pulse bg-surface" />
            </div>
          ) : order.data ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Ordine</dt>
                <dd className="font-bold tracking-wide text-leather">{order.data.code}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Intestato a</dt>
                <dd>{order.data.customerName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Totale</dt>
                <dd>{formatEuro(order.data.totalCents)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">
              {code
                ? "Non troviamo questo ordine. Scrivici su WhatsApp e lo verifichiamo subito."
                : "Nessun codice ordine indicato."}
            </p>
          )}
        </div>

        <div className="reveal delay-4 mt-8 flex flex-wrap justify-center gap-3">
          <a
            className="btn-wa"
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Ciao, ho appena pagato l'ordine ${code || ""}`.trim())}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" /> Avvisa su WhatsApp
          </a>
          <Link to="/catalogo" className="btn-ghost">
            Torna al catalogo
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PagamentoOkPage;
