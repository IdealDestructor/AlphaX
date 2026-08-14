"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockForecast } from "./mock";
import type { ForecastPageData, ForecastData, ForecastWindow, KeyLevel } from "./types";

interface BackendForecast {
  symbol: string;
  horizon: string;
  pUp?: number;
  pDown?: number;
  pRange?: number;
  medianPrice?: number;
  lowBound?: number;
  highBound?: number;
  confidence?: number;
  createdAt: string;
}

const HORIZON_LABELS: Record<string, string> = {
  "1d": "1 日",
  "1w": "7 日",
  "1m": "30 日",
  "3m": "90 日",
};

function mapForecast(raw: BackendForecast): ForecastData {
  const median = raw.medianPrice ?? 0;
  const low = raw.lowBound ?? median;
  const high = raw.highBound ?? median;
  const pUp = raw.pUp ?? 0.5;
  const direction = pUp >= 0.5 ? "bullish" : "bearish";
  const window: ForecastWindow = {
    label: HORIZON_LABELS[raw.horizon] ?? raw.horizon,
    days: raw.horizon === "1d" ? 1 : raw.horizon === "1w" ? 7 : raw.horizon === "1m" ? 30 : 90,
    direction,
    medianPrice: median,
    lowBound: low,
    highBound: high,
    probability: +(pUp).toFixed(2),
    confidence: raw.confidence ?? 0.5,
  };
  const keyLevels: KeyLevel[] = [
    { price: high, label: "预测上轨", type: "resistance", probability: +pUp.toFixed(2) },
    { price: median, label: "中枢 Pivot", type: "pivot", probability: +(raw.pRange ?? 0.5).toFixed(2) },
    { price: low, label: "预测下轨", type: "support", probability: +(raw.pDown ?? 0.5).toFixed(2) },
  ];
  return {
    symbol: raw.symbol,
    currentPrice: median,
    updatedAt: raw.createdAt,
    windows: [window],
    keyLevels,
    overallDirection: direction,
    overallConfidence: raw.confidence ?? 0.5,
  };
}

async function fetchForecast(symbol: string): Promise<ForecastPageData> {
  if (featureIsMock("forecast")) return fetchMockForecast(symbol);
  const raw = await apiClient.get<BackendForecast>("/forecast/latest", {
    params: { symbol, horizon: "1w" },
  });
  return {
    symbol,
    forecast: mapForecast(raw),
    availableSymbols: [],
    availableTimeframes: ["1d", "1w", "1m", "3m"],
  };
}

export function useForecast(symbol: string) {
  return useQuery({
    queryKey: ["forecast", symbol],
    queryFn: () => fetchForecast(symbol),
    staleTime: 60_000,
  });
}
