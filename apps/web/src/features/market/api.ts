"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockMarketData, MOCK_SYMBOLS } from "./mock";
import type { MarketData, Timeframe } from "./types";

async function fetchMarketData(symbol: string, timeframe: Timeframe): Promise<MarketData> {
  if (featureIsMock("market")) return fetchMockMarketData(symbol, timeframe);
  return apiClient.get<MarketData>(`/market/${symbol}`, {
    params: { timeframe, limit: "500" },
  });
}

export function useMarketData(symbol: string, timeframe: Timeframe) {
  return useQuery({
    queryKey: ["market", symbol, timeframe],
    queryFn: () => fetchMarketData(symbol, timeframe),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export { MOCK_SYMBOLS };
