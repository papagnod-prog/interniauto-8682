import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useShopInfo() {
  return useQuery(orpc.shop.info.queryOptions({ staleTime: 30_000 }));
}

export function useCategories() {
  return useQuery(orpc.shop.categories.queryOptions({ staleTime: 60_000 }));
}

export function useProducts(input: {
  category?: string;
  q?: string;
  sort?: "recenti" | "prezzo-asc" | "prezzo-desc";
  featured?: boolean;
}) {
  return useQuery(orpc.shop.products.queryOptions({ input, staleTime: 30_000 }));
}

export function useProduct(slug: string) {
  return useQuery(orpc.shop.product.queryOptions({ input: { slug }, staleTime: 30_000 }));
}
