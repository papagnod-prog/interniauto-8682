import { base } from "../__core/app";
import { shop } from "../lib/config";

/** Dati di contatto e configurazione negozio esposti al frontend. */
export const shopInfo = base.handler(() => ({
  name: shop.name,
  whatsappOrders: shop.whatsappOrders,
  whatsappPublic: shop.whatsappPublic,
  phone: shop.phone,
  email: shop.email,
  address: shop.address,
  vat: shop.vat,
  hours: [...shop.hours],
  shippingCents: shop.shippingCents,
  stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY),
}));
