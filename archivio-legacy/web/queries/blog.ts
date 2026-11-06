import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function usePosts(params?: { category?: string; limit?: number }) {
  return useQuery(orpc.blog.list.queryOptions({ input: params ?? {}, staleTime: 60_000 }));
}

export function usePost(slug: string) {
  return useQuery(
    orpc.blog.get.queryOptions({ input: { slug }, staleTime: 60_000, retry: false }),
  );
}
