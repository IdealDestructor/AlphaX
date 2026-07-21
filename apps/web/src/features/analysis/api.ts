"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMockAnalysis } from "./mock";
import type { AnalysisPageData, Timeframe } from "./types";

function fetchAnalysis(symbol: string): Promise<AnalysisPageData> {
  return new Promise((r) => setTimeout(() => r(fetchMockAnalysis(symbol)), 600));
}

export function useAnalysis(symbol: string) {
  return useQuery({
    queryKey: ["analysis", symbol],
    queryFn: () => fetchAnalysis(symbol),
    staleTime: 30_000,
  });
}

export type { Timeframe };
