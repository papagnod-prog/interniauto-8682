import { siteUrl } from "./config";

type LineItem = { name: string; priceCents: number; qty: number };

/**
 * Crea una Stripe Checkout Session e restituisce l'URL di pagamento.
 * Ritorna null se STRIPE_SECRET_KEY non è configurata o l'API risponde con errore.
 */
export async function createPaymentLink(params: {
  items: LineItem[];
  shippingCents?: number;
  orderCode: string;
  customerEmail?: string;
}): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${siteUrl()}/pagamento-ok?ordine=${params.orderCode}`);
  body.set("cancel_url", `${siteUrl()}/carrello`);
  body.set("client_reference_id", params.orderCode);
  body.set("metadata[order_code]", params.orderCode);
  if (params.customerEmail) body.set("customer_email", params.customerEmail);

  const allItems: LineItem[] = [...params.items];
  if (params.shippingCents && params.shippingCents > 0) {
    allItems.push({ name: "Spedizione", priceCents: params.shippingCents, qty: 1 });
  }

  allItems.forEach((item, i) => {
    body.set(`line_items[${i}][quantity]`, String(item.qty));
    body.set(`line_items[${i}][price_data][currency]`, "eur");
    body.set(`line_items[${i}][price_data][unit_amount]`, String(item.priceCents));
    body.set(`line_items[${i}][price_data][product_data][name]`, item.name.slice(0, 250));
  });

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = (await res.json()) as { url?: string; error?: { message?: string } };
    if (!res.ok || !data.url) {
      console.error("Stripe error:", data.error?.message ?? res.status);
      return null;
    }
    return data.url;
  } catch (err) {
    console.error("Stripe request failed:", err);
    return null;
  }
}
