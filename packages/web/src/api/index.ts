import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { handleStripeWebhook } from "./lib/stripe-webhook";
import { adminCatalog } from "./routes/admin-catalog";
import { adminShop } from "./routes/admin-shop";
import { checkout } from "./routes/checkout";
import { ping } from "./routes/ping";
import { shop } from "./routes/shop";

export const router = {
  ping,
  shop,
  checkout,
  admin: {
    ...adminShop,
    catalog: adminCatalog,
  },
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

/** Webhook Stripe (firma verificata, eventi idempotenti). */
app.post("/api/webhooks/stripe", async (c) => {
  const payload = await c.req.text();
  const [body, status] = await handleStripeWebhook(payload, c.req.header("stripe-signature"));
  return c.json(body, status);
});

export default app;
