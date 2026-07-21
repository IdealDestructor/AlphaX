import type { Bias, Action, RiskLevel, EvidenceItem, TradeLevels } from "@/features/dashboard/types";

export type { Bias, Action, RiskLevel, EvidenceItem, TradeLevels };
export type Timeframe = "15m" | "1H" | "4H" | "1D";

export interface AnalysisEntry {
  id: string;
  symbol: string;
  timeframe: Timeframe;
  trend: Bias;
  action: Action;
  confidence: number;
  riskLevel: RiskLevel;
  levels: TradeLevels;
  reasons: string[];
  evidence: EvidenceItem[];
  model: string;
  sourceAgent: string;
  createdAt: string;
  updatedAt: string;
  outcome?: {
    result: "hit_tp" | "hit_sl" | "pending" | "expired" | "invalid";
    pnlR?: number;
    pnlPct?: number;
    closedAt?: string;
  } | undefined;
}

export interface AccuracySummary {
  total: number;
  win: number;
  loss: number;
  winRate: number;
  avgR: number;
  byTimeframe: Record<string, { total: number; win: number; winRate: number }>;
}

export interface AnalysisPageData {
  symbol: string;
  current: AnalysisEntry;
  history: AnalysisEntry[];
  accuracy: AccuracySummary;
  availableTimeframes: Timeframe[];
  updatedAt: string;
}
