"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockWatchlist } from "./mock";
import type { WatchlistItem, WatchlistPageData } from "./types";

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async (): Promise<WatchlistPageData> => {
      if (featureIsMock("watchlist")) return fetchMockWatchlist();
      const items = await apiClient.get<WatchlistItem[]>("/watchlist");
      return { items };
    },
    staleTime: 30_000,
  });
}

export function useAddToWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (featureIsMock("watchlist")) return { symbol, sortOrder: 0 };
      return apiClient.post<{ symbol: string; sortOrder: number }>("/watchlist", { symbol });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (featureIsMock("watchlist")) return symbol;
      return apiClient.delete<{ ok: boolean }>(`/watchlist/${symbol}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}
