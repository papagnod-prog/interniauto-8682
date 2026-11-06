import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import type { CartLine } from "../lib/cart";

export function useQuote(items: CartLine[]) {
  return useQuery(
    orpc.checkout.quote.queryOptions({
      input: { items },
      enabled: items.length > 0,
      staleTime: 10_000,
    }),
  );
}

export function useCreateCheckout() {
  return useMutation(orpc.checkout.create.mutationOptions());
}

export function useOrderStatus(token: string, canceled: boolean) {
  return useQuery(
    orpc.checkout.order.queryOptions({
      input: { token, canceled: canceled || undefined },
      enabled: token.length >= 40,
      // Dopo il ritorno da Stripe il webhook può arrivare con qualche secondo di ritardo.
      refetchInterval: (q) => (q.state.data?.status === "pending_payment" ? 4000 : false),
    }),
  );
}
