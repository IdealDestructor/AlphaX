export type Timeframe = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W" | "1M";

export interface Quote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePct: number;
  high24h: number;
  low24h: number;
  volume: number;
  prevClose: number;
  updatedAt: string;
}

export interface Candle {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorSummary {
  name: string;
  value: string;
  direction: "up" | "down" | "flat";
  signal: "buy" | "sell" | "neutral";
}

export interface MarketSymbol {
  symbol: string;
  name: string;
  group: string;
}

export interface MarketData {
  symbol: MarketSymbol;
  quote: Quote;
  candles: Candle[];
  indicators: IndicatorSummary[];
}
