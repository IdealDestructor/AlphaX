"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockMarketData, MOCK_SYMBOLS } from "./mock";
import type { MarketData, MarketSymbol, Quote, Candle, IndicatorSummary, Timeframe } from "./types";

interface BackendSymbol {
  code: string;
  name: string;
  assetClass: string;
  isActive?: boolean;
}

interface BackendQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
  source?: "tickflow" | "twelve-data" | "binance" | "treasury" | "mock";
}

type BackendIndicator = Record<string, any>;

/** Frontend timeframe → backend interval. Backend uses lowercase keys. */
function toBackendInterval(tf: Timeframe): string {
  const map: Record<Timeframe, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1H": "1h",
    "4H": "4h",
    "1D": "1d",
    "1W": "1w",
    "1M": "1w", // 后端无月度键，回退到周线
  };
  return map[tf] ?? "1h";
}

function mapSymbol(raw: BackendSymbol): MarketSymbol {
  return {
    symbol: raw.code,
    name: raw.name,
    group: raw.assetClass,
  };
}

function mapQuote(raw: BackendQuote): Quote {
  const bid = raw.price - 0.15;
  const ask = raw.price + 0.15;
  return {
    symbol: raw.symbol,
    source: raw.source ?? "mock",
    price: raw.price,
    bid,
    ask,
    change: raw.change,
    changePct: raw.changePercent,
    high24h: raw.high,
    low24h: raw.low,
    volume: raw.volume,
    prevClose: raw.open,
    updatedAt: raw.timestamp,
  };
}

function mapIndicators(raw: BackendIndicator, price: number): IndicatorSummary[] {
  const list: IndicatorSummary[] = [];
  const rsi = raw?.rsi?.[raw.rsi.length - 1]?.value as number | undefined;
  if (rsi !== undefined) {
    list.push({
      name: "RSI(14)",
      value: rsi.toFixed(2),
      direction: rsi > 55 ? "up" : rsi < 45 ? "down" : "flat",
      signal: rsi >= 70 ? "sell" : rsi <= 30 ? "buy" : "neutral",
    });
  }
  const macd = raw?.macd as
    | { macdLine?: { value: number }[]; signal?: { value: number }[] }
    | undefined;
  if (macd?.macdLine?.length && macd?.signal?.length) {
    const m = macd.macdLine[macd.macdLine.length - 1]!.value;
    const s = macd.signal[macd.signal.length - 1]!.value;
    list.push({
      name: "MACD",
      value: m >= s ? "金叉" : "死叉",
      direction: m >= s ? "up" : "down",
      signal: m >= s ? "buy" : "sell",
    });
  }
  const ema20 = raw?.ema?.[raw.ema.length - 1]?.value as number | undefined;
  if (ema20 !== undefined) {
    list.push({
      name: "EMA(20)",
      value: ema20.toFixed(2),
      direction: ema20 >= price ? "up" : "down",
      signal: ema20 >= price ? "buy" : "sell",
    });
  }
  const sma = raw?.sma as { value: number }[] | undefined;
  if (sma?.length) {
    const v = sma[sma.length - 1]!.value;
    list.push({
      name: "SMA(20)",
      value: v.toFixed(2),
      direction: v >= price ? "up" : "down",
      signal: v >= price ? "buy" : "sell",
    });
  }
  if (list.length === 0) {
    list.push({ name: "指标", value: "—", direction: "flat", signal: "neutral" });
  }
  return list;
}

async function fetchMarketData(symbol: string, timeframe: Timeframe): Promise<MarketData> {
  if (featureIsMock("market")) return fetchMockMarketData(symbol, timeframe);

  const interval = toBackendInterval(timeframe);
  const symbols = apiClient.get<BackendSymbol[]>("/market/symbols");
  const quotes = apiClient.get<BackendQuote[]>("/market/quotes", {
    params: { symbols: symbol },
  });
  const candles = apiClient.get<Candle[]>("/market/candles", {
    params: { symbol, interval, limit: 500 },
  });
  const indicators = apiClient.get<BackendIndicator>("/market/indicators", {
    params: { symbol, interval },
  });

  const [symbolList, quoteList, candleList, indicatorData] = await Promise.all([
    symbols,
    quotes,
    candles,
    indicators,
  ]);

  const meta = symbolList.find((s) => s.code === symbol) ?? {
    code: symbol,
    name: symbol,
    assetClass: "其他",
  };
  const quoteRaw = quoteList[0] ?? {
    symbol,
    price: 0,
    change: 0,
    changePercent: 0,
    open: 0,
    close: 0,
    high: 0,
    low: 0,
    volume: 0,
    timestamp: new Date().toISOString(),
    source: "mock",
  };
  const quote = mapQuote(quoteRaw);
  const price = candleList.length ? candleList[candleList.length - 1]!.close : quote.price;

  return {
    symbol: mapSymbol(meta),
    quote,
    candles: candleList,
    indicators: mapIndicators(indicatorData, price),
  };
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


