"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMockMarketData } from "./mock";
import type { MarketData, Timeframe } from "./types";

export function useMarketData(symbol: string, timeframe: Timeframe) {
  return useQuery({
    queryKey: ["market", symbol, timeframe],
    queryFn: () => {
      const data = fetchMockMarketData(symbol, timeframe);
      return data as MarketData;
    },
    staleTime: 15_000,
  });
}

export { MOCK_SYMBOLS } from "./mock";
