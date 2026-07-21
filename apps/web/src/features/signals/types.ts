import type { Action, Direction, EvidenceItem, TradeLevels, RiskLevel } from "@/features/dashboard/types";

export type { Action, Direction, EvidenceItem, TradeLevels, RiskLevel };

export interface SignalDetail {
  id: string;
  symbol: string;
  timeframe: string;
  createdAt: string;
  side: Action;
  direction: Direction;
  entry: string;
  stopLoss: string;
  takeProfit: string;
  confidence: number;
  riskLevel: RiskLevel;
  reasons: string[];
  evidence: EvidenceItem[];
  outcome: "pending" | "hit_tp" | "hit_sl" | "expired";
  pnlR: number | null;
  pnlPct: number | null;
  closedAt: string | null;
  model: string;
}

export interface SignalStats {
  total: number;
  win: number;
  loss: number;
  pending: number;
  winRate: number;
  avgR: number;
  profitFactor: number;
  bySymbol: Record<string, { total: number; win: number; winRate: number; avgR: number }>;
  byTimeframe: Record<string, { total: number; win: number; winRate: number }>;
}

export interface SignalsPageData {
  signals: SignalDetail[];
  stats: SignalStats;
  availableSymbols: string[];
  availableTimeframes: string[];
}
