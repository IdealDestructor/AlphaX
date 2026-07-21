"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMockForecast } from "./mock";
import type { ForecastPageData } from "./types";

function fetchForecast(symbol: string): Promise<ForecastPageData> {
  return new Promise((r) => setTimeout(() => r(fetchMockForecast(symbol)), 700));
}

export function useForecast(symbol: string) {
  return useQuery({
    queryKey: ["forecast", symbol],
    queryFn: () => fetchForecast(symbol),
    staleTime: 30_000,
  });
}
