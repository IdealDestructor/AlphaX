export type Bias = "bullish" | "bearish" | "neutral";
export type Action = "buy" | "sell" | "wait";
export type RiskLevel = "low" | "medium" | "high";
export type Direction = "up" | "down" | "flat";

export interface EvidenceItem {
  source: string;
  signal: string;
  weight: number;
}

export interface TradeLevels {
  entry: string;
  stopLoss: string;
  takeProfit: string;
}

export interface AiAnalysis {
  symbol: string;
  trend: Bias;
  action: Action;
  confidence: number;
  riskLevel: RiskLevel;
  levels: TradeLevels;
  reasons: string[];
  evidence: EvidenceItem[];
  updatedAt: string;
  model: string;
}

export interface Kpi {
  price: number;
  priceChangeAbs: number;
  priceChangePct: number;
  confidence: number;
  confidenceDelta: number;
  riskLevel: RiskLevel;
  atr: number;
  sentiment: number;
  sentimentLabel: string;
}

export interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  direction: Direction;
}

export interface SignalRow {
  time: string;
  symbol: string;
  side: Action;
  entry: string;
  confidence: number;
  outcome: string;
  outcomeDirection: Direction;
}

export interface Sentiment {
  score: number;
  label: string;
  longPct: number;
  shortPct: number;
  etfInflow: string;
  cotChange: string;
}

export interface NewsItem {
  time: string;
  title: string;
  tag: string;
  tagTone: "pos" | "neg" | "neutral";
  source: string;
}

export interface DashboardData {
  kpi: Kpi;
  ticker: TickerItem[];
  analysis: AiAnalysis;
  signals: SignalRow[];
  sentiment: Sentiment;
  news: NewsItem[];
  updatedAt: string;
}
