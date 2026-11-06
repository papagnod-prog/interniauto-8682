import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useAdminMe() {
  return useQuery(orpc.admin.me.queryOptions({ retry: false, staleTime: 60_000 }));
}

export function useOverview() {
  return useQuery(orpc.admin.overview.queryOptions());
}

// ── Catalogo ──
export function useAdminProducts(scope: "current" | "legacy") {
  return useQuery(orpc.admin.catalog.products.list.queryOptions({ input: { scope } }));
}

export function useAdminProduct(id: number | null) {
  return useQuery(
    orpc.admin.catalog.products.get.queryOptions({ input: { id: id ?? 0 }, enabled: !!id }),
  );
}

function useInvalidateCatalog() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: orpc.admin.catalog.key() }),
      qc.invalidateQueries({ queryKey: orpc.admin.overview.key() }),
      qc.invalidateQueries({ queryKey: orpc.shop.key() }),
    ]);
}

export function useSaveProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation(orpc.admin.catalog.products.save.mutationOptions({ onSuccess: invalidate }));
}

export function useRemoveProduct() {
  const invalidate = useInvalidateCatalog();
  return useMutation(orpc.admin.catalog.products.remove.mutationOptions({ onSuccess: invalidate }));
}

export function usePresignImage() {
  return useMutation(orpc.admin.catalog.presignImage.mutationOptions());
}

export function useAdminCategories() {
  return useQuery(orpc.admin.catalog.categories.list.queryOptions());
}

export function useSaveCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation(orpc.admin.catalog.categories.save.mutationOptions({ onSuccess: invalidate }));
}

export function useRemoveCategory() {
  const invalidate = useInvalidateCatalog();
  return useMutation(orpc.admin.catalog.categories.remove.mutationOptions({ onSuccess: invalidate }));
}

// ── Ordini ──
export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "shipped"
  | "delivered"
  | "expired"
  | "canceled"
  | "review";

export function useAdminOrders(status?: OrderStatus) {
  return useQuery(orpc.admin.orders.list.queryOptions({ input: status ? { status } : {} }));
}

export function useAdminOrder(id: string) {
  return useQuery(orpc.admin.orders.get.queryOptions({ input: { id } }));
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation(
    orpc.admin.orders.update.mutationOptions({
      onSuccess: () =>
        Promise.all([
          qc.invalidateQueries({ queryKey: orpc.admin.orders.key() }),
          qc.invalidateQueries({ queryKey: orpc.admin.overview.key() }),
        ]),
    }),
  );
}

// ── Impostazioni ──
export function useAdminSettings() {
  return useQuery(orpc.admin.settings.get.queryOptions());
}

function useInvalidateSettings() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: orpc.admin.settings.key() }),
      qc.invalidateQueries({ queryKey: orpc.admin.overview.key() }),
      qc.invalidateQueries({ queryKey: orpc.shop.info.key() }),
    ]);
}

export function useSaveShipping() {
  const invalidate = useInvalidateSettings();
  return useMutation(orpc.admin.settings.saveShipping.mutationOptions({ onSuccess: invalidate }));
}

export function useSaveStripe() {
  const invalidate = useInvalidateSettings();
  return useMutation(orpc.admin.settings.saveStripe.mutationOptions({ onSuccess: invalidate }));
}

export function useClearStripe() {
  const invalidate = useInvalidateSettings();
  return useMutation(orpc.admin.settings.clearStripe.mutationOptions({ onSuccess: invalidate }));
}
