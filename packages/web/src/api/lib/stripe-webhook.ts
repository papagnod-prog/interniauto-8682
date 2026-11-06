import { db } from "../database";
import { stripeEvents } from "../database/schema";
import { getStripeSecrets } from "./settings";
import { applyPaidSession, releaseOrder } from "./shop";
import { verifyStripeSignature, type StripeCheckoutSession } from "./stripe";

type StripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: StripeCheckoutSession };
};

/**
 * Webhook Stripe: firma obbligatoria, evento registrato una sola volta (idempotenza).
 * Restituisce [body, status] per la rotta Hono.
 */
export async function handleStripeWebhook(payload: string, signature: string | undefined) {
  const { testWebhookSecret } = await getStripeSecrets();
  if (!testWebhookSecret) return [{ error: "webhook non configurato" }, 503] as const;
  if (!verifyStripeSignature(payload, signature, testWebhookSecret)) {
    return [{ error: "firma non valida" }, 400] as const;
  }
  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return [{ error: "payload non valido" }, 400] as const;
  }
  // Fase 2: accettiamo solo eventi di test.
  if (event.livemode) return [{ error: "modalità live non attiva" }, 400] as const;

  const session = event.data?.object;
  const relevant = event.type.startsWith("checkout.session.");
  if (relevant && session?.metadata?.order_id) {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (session.payment_status === "paid") await applyPaidSession(session);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await releaseOrder(session.metadata.order_id, "expired");
    }
  }
  // Registrato dopo l'elaborazione: le operazioni sopra sono idempotenti, quindi una
  // ripetizione di Stripe dopo un errore non produce doppi effetti.
  await db
    .insert(stripeEvents)
    .values({ id: event.id, type: event.type, mode: event.livemode ? "live" : "test" })
    .onConflictDoNothing();
  return [{ received: true }, 200] as const;
}
