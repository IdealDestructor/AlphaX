"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockAnalysis } from "./mock";
import type { AnalysisPageData, Timeframe } from "./types";

async function fetchAnalysis(symbol: string): Promise<AnalysisPageData> {
  if (featureIsMock("analysis")) return fetchMockAnalysis(symbol);
  return apiClient.get<AnalysisPageData>(`/analysis/${symbol}`);
}

export function useAnalysis(symbol: string) {
  return useQuery({
    queryKey: ["analysis", symbol],
    queryFn: () => fetchAnalysis(symbol),
    staleTime: 120_000,
  });
}

export type { Timeframe };
