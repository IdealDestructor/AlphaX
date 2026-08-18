"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockForecast } from "./mock";
import type { Bias, ForecastPageData, ForecastData, ForecastWindow, KeyLevel } from "./types";

interface BackendForecast {
  symbol: string;
  horizon: string;
  pUp?: number | null;
  pDown?: number | null;
  pRange?: number | null;
  medianPrice?: number | null;
  lowBound?: number | null;
  highBound?: number | null;
  confidence?: number | null;
  createdAt: string;
}

interface WindowLabel {
  label: string;
  days: number;
}

interface WindowSlot extends WindowLabel {
  horizon: string;
}

const HEADLINE_SLOTS: WindowSlot[] = [
  { horizon: "1d", label: "1 日", days: 1 },
  { horizon: "1w", label: "7 日", days: 7 },
  { horizon: "1m", label: "30 日", days: 30 },
];

function toWindow(raw: BackendForecast | null, slot: WindowLabel): ForecastWindow | null {
  if (!raw) return null;
  const median = raw.medianPrice ?? 0;
  const low = raw.lowBound ?? median;
  const high = raw.highBound ?? median;
  const pUp = raw.pUp ?? 0.5;
  return {
    label: slot.label,
    days: slot.days,
    direction: pUp >= 0.5 ? "bullish" : "bearish",
    medianPrice: median,
    lowBound: low,
    highBound: high,
    probability: +pUp.toFixed(2),
    confidence: raw.confidence ?? 0.5,
  };
}

function interpolate(a: ForecastWindow, b: ForecastWindow, slot: WindowLabel, t: number): ForecastWindow {
  const lerp = (x: number, y: number) => +(x + (y - x) * t).toFixed(2);
  const probability = lerp(a.probability, b.probability);
  return {
    label: slot.label,
    days: slot.days,
    direction: probability >= 0.5 ? "bullish" : "bearish",
    medianPrice: lerp(a.medianPrice, b.medianPrice),
    lowBound: lerp(a.lowBound, b.lowBound),
    highBound: lerp(a.highBound, b.highBound),
    probability,
    confidence: lerp(a.confidence, b.confidence),
  };
}

function buildWindows(list: Array<ForecastWindow | null>): ForecastWindow[] {
  const [d1, w1, m1] = list;
  const d3 = d1 && w1 ? interpolate(d1, w1, { label: "3 日", days: 3 }, 3 / 7) : null;
  const d14 = w1 && m1 ? interpolate(w1, m1, { label: "14 日", days: 14 }, 14 / 30) : null;
  return [d1, d3, w1, d14, m1].filter((w): w is ForecastWindow => w != null);
}

async function fetchForecast(symbol: string): Promise<ForecastPageData> {
  if (featureIsMock("forecast")) return fetchMockForecast(symbol);

  const rawList = await Promise.all(
    HEADLINE_SLOTS.map((slot) =>
      apiClient.get<BackendForecast | null>("/forecast/latest", {
        params: { symbol, horizon: slot.horizon },
      }),
    ),
  );

  const windows = buildWindows(HEADLINE_SLOTS.map((slot, i) => toWindow(rawList[i] ?? null, slot)));
  const headline = windows.find((w) => w.label === "7 日") ?? windows[0] ?? null;
  const currentPrice = windows.find((w) => w.days === 1)?.medianPrice ?? windows[0]?.medianPrice ?? 0;
  const overallDirection: Bias = headline?.direction ?? "neutral";
  const overallConfidence = headline?.confidence ?? 0.5;
  const keyLevels: KeyLevel[] = headline
    ? [
        { price: headline.highBound, label: "预测上轨", type: "resistance", probability: headline.probability },
        { price: headline.medianPrice, label: "中枢 Pivot", type: "pivot", probability: headline.probability },
        { price: headline.lowBound, label: "预测下轨", type: "support", probability: headline.probability },
      ]
    : [];

  const fallbackWindow: ForecastWindow = {
    label: "7 日",
    days: 7,
    direction: "neutral",
    medianPrice: currentPrice,
    lowBound: currentPrice,
    highBound: currentPrice,
    probability: 0.5,
    confidence: 0.5,
  };

  return {
    symbol,
    forecast: {
      symbol,
      currentPrice,
      updatedAt: rawList[1]?.createdAt ?? rawList[0]?.createdAt ?? new Date().toISOString(),
      windows: windows.length ? windows : [fallbackWindow],
      keyLevels,
      overallDirection,
      overallConfidence,
    },
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
