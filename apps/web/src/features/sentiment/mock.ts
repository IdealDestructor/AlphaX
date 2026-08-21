import type { SentimentItem, SentimentPageData } from "./types";

function item(
  symbol: string,
  score: number,
  newsCount: number,
  social: number,
): SentimentItem {
  return {
    symbol,
    score: Math.round(score * 100) / 100,
    label: score > 0.15 ? "bullish" : score < -0.15 ? "bearish" : "neutral",
    intensity: Math.round(Math.abs(score) * 100) / 100,
    newsCount,
    components: {
      news: Math.round(score * 100) / 100,
      social: Math.round(social * 100) / 100,
    },
    updatedAt: new Date().toISOString(),
    sources: { news: "real", social: "mock" },
  };
}

const MOCK_ITEMS: SentimentItem[] = [
  item("XAUUSD", 0.42, 18, 0.31),
  item("XAGUSD", 0.18, 9, 0.12),
  item("BTCUSD", -0.25, 22, -0.4),
  item("DXY", -0.35, 11, -0.2),
  item("US10Y", -0.12, 6, -0.05),
  item("NAS100", 0.08, 14, 0.02),
  item("SPX500", 0.05, 12, 0.01),
  item("WTI", 0.22, 8, 0.15),
];

export function fetchMockSentiment(): SentimentPageData {
  return {
    items: MOCK_ITEMS,
    total: MOCK_ITEMS.length,
    generatedAt: new Date().toISOString(),
    market: { score: 0.24, label: "贪婪", rating: "Greed", source: "mock", updatedAt: new Date().toISOString() },
  };
}

