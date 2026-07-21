import type { ForecastPageData, ForecastData } from "./types";

const NOW = Date.now();

function buildForecast(symbol: string, price: number): ForecastData {
  return {
    symbol,
    currentPrice: price,
    updatedAt: new Date(NOW).toISOString(),
    windows: [
      { label: "1 日", days: 1, direction: "bullish", medianPrice: +(price + 8 + Math.random() * 4).toFixed(2), lowBound: +(price - 4 - Math.random() * 4).toFixed(2), highBound: +(price + 14 + Math.random() * 6).toFixed(2), probability: +(0.55 + Math.random() * 0.15).toFixed(2), confidence: +(0.6 + Math.random() * 0.15).toFixed(2) },
      { label: "3 日", days: 3, direction: "bullish", medianPrice: +(price + 14 + Math.random() * 6).toFixed(2), lowBound: +(price - 8 - Math.random() * 6).toFixed(2), highBound: +(price + 22 + Math.random() * 10).toFixed(2), probability: +(0.5 + Math.random() * 0.2).toFixed(2), confidence: +(0.55 + Math.random() * 0.15).toFixed(2) },
      { label: "7 日", days: 7, direction: "bullish", medianPrice: +(price + 20 + Math.random() * 10).toFixed(2), lowBound: +(price - 14 - Math.random() * 8).toFixed(2), highBound: +(price + 36 + Math.random() * 14).toFixed(2), probability: +(0.45 + Math.random() * 0.2).toFixed(2), confidence: +(0.5 + Math.random() * 0.15).toFixed(2) },
      { label: "14 日", days: 14, direction: "neutral", medianPrice: +(price + 10 + Math.random() * 20).toFixed(2), lowBound: +(price - 24 - Math.random() * 12).toFixed(2), highBound: +(price + 44 + Math.random() * 20).toFixed(2), probability: +(0.4 + Math.random() * 0.2).toFixed(2), confidence: +(0.4 + Math.random() * 0.15).toFixed(2) },
      { label: "30 日", days: 30, direction: "neutral", medianPrice: +(price + 5 + Math.random() * 30).toFixed(2), lowBound: +(price - 40 - Math.random() * 16).toFixed(2), highBound: +(price + 60 + Math.random() * 30).toFixed(2), probability: +(0.35 + Math.random() * 0.2).toFixed(2), confidence: +(0.3 + Math.random() * 0.15).toFixed(2) },
    ],
    keyLevels: [
      { price: +(price + 12 + Math.random() * 4).toFixed(2), label: "短期阻力 R1", type: "resistance", probability: +(0.6 + Math.random() * 0.15).toFixed(2) },
      { price: +(price + 28 + Math.random() * 8).toFixed(2), label: "中期阻力 R2", type: "resistance", probability: +(0.35 + Math.random() * 0.15).toFixed(2) },
      { price: +(price - 8 - Math.random() * 4).toFixed(2), label: "短期支撑 S1", type: "support", probability: +(0.55 + Math.random() * 0.15).toFixed(2) },
      { price: +(price - 24 - Math.random() * 8).toFixed(2), label: "中期支撑 S2", type: "support", probability: +(0.3 + Math.random() * 0.1).toFixed(2) },
      { price: +(price + 2 - Math.random() * 4).toFixed(2), label: "中枢 Pivot", type: "pivot", probability: +(0.45 + Math.random() * 0.1).toFixed(2) },
    ],
    overallDirection: "bullish",
    overallConfidence: +(0.55 + Math.random() * 0.15).toFixed(2),
  };
}

const SYMBOLS = ["XAUUSD", "XAGUSD", "BTCUSD", "DXY"];

export function fetchMockForecast(symbol: string): ForecastPageData {
  const basePrices: Record<string, number> = {
    XAUUSD: 2384.6,
    XAGUSD: 28.74,
    BTCUSD: 67420,
    DXY: 104.28,
  };
  const price = basePrices[symbol] ?? 2384.6;
  return {
    symbol,
    forecast: buildForecast(symbol, price),
    availableSymbols: SYMBOLS,
    availableTimeframes: ["4H", "1D", "1W"],
  };
}
