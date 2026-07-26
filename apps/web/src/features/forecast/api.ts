"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockForecast } from "./mock";
import type { ForecastPageData } from "./types";

async function fetchForecast(symbol: string): Promise<ForecastPageData> {
  if (featureIsMock("forecast")) return fetchMockForecast(symbol);
  return apiClient.get<ForecastPageData>(`/forecast/${symbol}`);
}

export function useForecast(symbol: string) {
  return useQuery({
    queryKey: ["forecast", symbol],
    queryFn: () => fetchForecast(symbol),
    staleTime: 60_000,
  });
}
