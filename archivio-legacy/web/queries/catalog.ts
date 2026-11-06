import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useCategories() {
  return useQuery(orpc.catalog.categories.queryOptions({ staleTime: 60_000 }));
}

export function useProducts(params?: { category?: string; featured?: boolean }) {
  return useQuery(
    orpc.catalog.products.queryOptions({ input: params ?? {}, staleTime: 30_000 }),
  );
}

export function useProduct(slug: string) {
  return useQuery(
    orpc.catalog.product.queryOptions({ input: { slug }, staleTime: 30_000, retry: false }),
  );
}

export function useShopInfo() {
  return useQuery(orpc.shopInfo.queryOptions({ staleTime: Infinity }));
}
