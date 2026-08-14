"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockAnalysis } from "./mock";
import type { AnalysisPageData, AnalysisEntry, AccuracySummary, Timeframe } from "./types";

/** Backend analysis record (see /analysis/{symbol} and /analysis/{symbol}/history). */
interface BackendAnalysis {
  id?: string;
  symbol: string;
  timeframe: string;
  trend: string;
  action: string;
  confidence: number; // 0–1
  entry?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  riskLevel: string;
  summary?: string | null;
  reasons?: string[];
  evidence?: Array<{ source: string; signal: string; weight: number }>;
  modelVersions?: { version?: string } | null;
  createdAt?: string;
}

interface BackendSignalStats {
  total: number;
  winRate: number;
  win: number;
  loss: number;
  byStatus?: Record<string, number>;
}

const isValidBias = (v?: string): v is AnalysisEntry["trend"] =>
  v === "bullish" || v === "bearish" || v === "neutral";

function mapAction(action: string): AnalysisEntry["action"] {
  if (action === "hold") return "wait";
  if (action === "buy" || action === "sell") return action;
  return "wait";
}

function mapConfidence(conf: number | undefined): number {
  if (conf === undefined || Number.isNaN(conf)) return 0;
  return Math.round(conf * 100);
}

function trimEvidence(evidence?: BackendAnalysis["evidence"]): AnalysisEntry["evidence"] {
  if (!Array.isArray(evidence) || evidence.length === 0) return [];
  return evidence.slice(0, 4);
}

function mapAnalysis(raw: BackendAnalysis): AnalysisEntry {
  return {
    id: raw.id ?? `live_${raw.symbol}_${raw.timeframe}`,
    symbol: raw.symbol,
    timeframe: (raw.timeframe || "1d") as AnalysisEntry["timeframe"],
    trend: isValidBias(raw.trend) ? raw.trend : "neutral",
    action: mapAction(raw.action),
    confidence: mapConfidence(raw.confidence),
    riskLevel: (["low", "medium", "high"].includes(raw.riskLevel) ? raw.riskLevel : "medium") as AnalysisEntry["riskLevel"],
    levels: {
      entry: raw.entry != null ? String(raw.entry) : "—",
      stopLoss: raw.stopLoss != null ? String(raw.stopLoss) : "—",
      takeProfit: raw.takeProfit != null ? String(raw.takeProfit) : "—",
    },
    reasons: raw.reasons && raw.reasons.length > 0 ? raw.reasons : raw.summary ? [raw.summary] : [],
    evidence: trimEvidence(raw.evidence),
    model: raw.modelVersions?.version ?? "fusion-v2.1",
    sourceAgent: "coordinator",
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function mapAccuracy(stats: BackendSignalStats | null): AccuracySummary {
  const total = stats?.total ?? 0;
  const win = stats?.win ?? 0;
  const loss = stats?.loss ?? 0;
  return {
    total,
    win,
    loss,
    winRate: total > 0 ? win / total : 0,
    avgR: 0,
    byTimeframe: {},
  };
}

async function fetchAnalysis(symbol: string, timeframe: Timeframe): Promise<AnalysisPageData> {
  if (featureIsMock("analysis")) return fetchMockAnalysis(symbol);

  const tf = timeframe.toLowerCase();
  const latest = apiClient.get<BackendAnalysis>("/analysis/" + symbol, {
    params: { timeframe: tf },
  });
  const history = apiClient.get<BackendAnalysis[]>("/analysis/" + symbol + "/history", {
    params: { timeframe: tf, limit: 20 },
  });
  const stats = apiClient
    .get<BackendSignalStats>("/signals/stats")
    .catch(() => null);

  const [latestRaw, historyRaw, statsRaw] = await Promise.all([latest, history, stats]);
  const current = mapAnalysis(latestRaw);
  const historyEntries = Array.isArray(historyRaw)
    ? historyRaw.map(mapAnalysis).filter((h) => h.id !== current.id)
    : [];

  return {
    symbol,
    current,
    history: historyEntries,
    accuracy: mapAccuracy(statsRaw),
    availableTimeframes: ["15m", "1H", "4H", "1D"],
    updatedAt: new Date().toISOString(),
  };
}

export function useAnalysis(symbol: string) {
  return useQuery({
    queryKey: ["analysis", symbol],
    queryFn: () => fetchAnalysis(symbol, "4H"),
    staleTime: 120_000,
  });
}

/** Force the backend decision pipeline to regenerate and persist a fresh analysis. */
export function useRefreshAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string) => {
      if (featureIsMock("analysis")) return null;
      return apiClient.post<BackendAnalysis>("/analysis/" + symbol + "/refresh", null, {});
    },
    onSuccess: (_data, symbol) => {
      void queryClient.invalidateQueries({ queryKey: ["analysis", symbol] });
    },
  });
}

export type { Timeframe };
