import type { Candle, MarketData, Timeframe } from "./types";

const SYMBOLS = [
  { symbol: "XAUUSD", name: "黄金 / 美元", group: "贵金属" },
  { symbol: "XAGUSD", name: "白银 / 美元", group: "贵金属" },
  { symbol: "DXY", name: "美元指数", group: "外汇" },
  { symbol: "US10Y", name: "美国 10 年期国债", group: "利率" },
  { symbol: "BTCUSD", name: "比特币 / 美元", group: "加密货币" },
  { symbol: "VIX", name: "波动率指数", group: "情绪" },
  { symbol: "NAS100", name: "纳斯达克 100", group: "股指" },
  { symbol: "WTI", name: "WTI 原油", group: "大宗商品" },
] as const;

const CANDLE_COUNT = 120;
const BASE_PRICE = 2384.0;
const BASE_VOLUME = 15000;

function generateCandles(count: number, base: number, amplitude: number, seed = 1): Candle[] {
  const candles: Candle[] = [];
  let price = base;
  let vol = BASE_VOLUME;
  for (let i = 0; i < count; i++) {
    const change = (Math.sin(i * 0.12 + seed) * 0.5 + Math.cos(i * 0.07 + seed) * 0.3 + (Math.random() - 0.5) * 0.6) * amplitude;
    const open = price;
    const close = +(price + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * amplitude * 0.6).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * amplitude * 0.6).toFixed(2);
    const v = Math.max(2000, Math.round(vol * (0.85 + Math.random() * 0.3)));
    candles.push({
      time: Math.floor(Date.now() / 1000) - (count - i) * 3600,
      open,
      high,
      low,
      close,
      volume: v,
    });
    price = close;
    vol = v;
  }
  return candles;
}

function getQuote(symbol: string, price: number) {
  const change = +(Math.random() * 6 - 3).toFixed(2);
  return {
    symbol,
    price: +price.toFixed(2),
    bid: +(price - 0.15 - Math.random() * 0.1).toFixed(2),
    ask: +(price + 0.15 + Math.random() * 0.1).toFixed(2),
    change,
    changePct: +((change / price) * 100).toFixed(2),
    high24h: +(price + Math.random() * 12).toFixed(2),
    low24h: +(price - Math.random() * 12).toFixed(2),
    volume: Math.round(80000 + Math.random() * 40000),
    prevClose: +(price - change).toFixed(2),
    updatedAt: new Date().toISOString(),
  };
}

export function fetchMockMarketData(symbol: string, timeframe: Timeframe): MarketData {
  const found = SYMBOLS.find((s) => s.symbol === symbol) ?? {
    symbol,
    name: symbol,
    group: "其他",
  };

  const amp = timeframe === "1m" ? 0.4 : timeframe === "5m" ? 0.8 : timeframe === "15m" ? 1.2 : timeframe === "1H" ? 2.5 : timeframe === "4H" ? 5 : timeframe === "1D" ? 10 : timeframe === "1W" ? 20 : 30;

  const candles = generateCandles(CANDLE_COUNT, BASE_PRICE, amp);
  const price = candles[candles.length - 1]!.close;
  const quote = getQuote(symbol, price);

  const indList = [
    { name: "RSI(14)", value: `${Math.round(40 + Math.random() * 30)}`, direction: "up" as const, signal: "neutral" as const },
    { name: "MACD", value: Math.random() > 0.5 ? "金叉" : "死叉", direction: Math.random() > 0.5 ? "up" as const : "down" as const, signal: Math.random() > 0.5 ? "buy" as const : "sell" as const },
    { name: "ATR(14)", value: `${(Math.random() * 15 + 10).toFixed(1)}`, direction: "flat" as const, signal: "neutral" as const },
    { name: "VWAP", value: `${(price - 2 + Math.random() * 4).toFixed(2)}`, direction: Math.random() > 0.5 ? "up" as const : "down" as const, signal: Math.random() > 0.5 ? "buy" as const : "sell" as const },
    { name: "BB(20,2)", value: `上 ${(price + 8 + Math.random() * 6).toFixed(1)} / 下 ${(price - 8 - Math.random() * 6).toFixed(1)}`, direction: "flat" as const, signal: "neutral" as const },
    { name: "EMA(20)", value: `${(price - 1 + Math.random() * 2).toFixed(2)}`, direction: price > BASE_PRICE ? "up" as const : "down" as const, signal: price > BASE_PRICE ? "buy" as const : "sell" as const },
    { name: "EMA(50)", value: `${(price - 3 + Math.random() * 6).toFixed(2)}`, direction: "flat" as const, signal: "neutral" as const },
    { name: "SuperTrend", value: Math.random() > 0.4 ? "上升通道" : "下降通道", direction: Math.random() > 0.4 ? "up" as const : "down" as const, signal: Math.random() > 0.4 ? "buy" as const : "sell" as const },
  ];

  return {
    symbol: found,
    quote,
    candles,
    indicators: indList,
  };
}

export const MOCK_SYMBOLS = SYMBOLS;
export type MockSymbol = (typeof SYMBOLS)[number]["symbol"];
