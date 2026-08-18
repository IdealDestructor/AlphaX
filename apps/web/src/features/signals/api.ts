"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSignals } from "./mock";
import type { Action, SignalDetail, SignalStats, SignalsPageData } from "./types";

interface BackendSignal {
  id: string;
  symbol: string;
  action: string;
  price?: number | null;
  entry?: number | null;
  tp?: number | null;
  sl?: number | null;
  confidence?: number | null;
  status: string;
  timeframe?: string | null;
  createdAt: string;
  closedAt?: string | null;
}

interface BackendStats {
  total: number;
  winRate: number;
  win: number;
  loss: number;
  byAction: Record<string, number>;
  byStatus: Record<string, number>;
}

function mapSignal(raw: BackendSignal): SignalDetail {
  const side: Action = raw.action === "buy" || raw.action === "sell" || raw.action === "wait" ? raw.action : "wait";
  const confidence = raw.confidence != null ? Math.round(raw.confidence * 100) : 0;
  const status = raw.status;
  const outcome: SignalDetail["outcome"] =
    status === "hit_tp" || status === "hit_sl" || status === "expired"
      ? status
      : status === "open"
        ? "pending"
        : "expired";
  const timeframe = raw.timeframe ?? "";

  return {
    id: raw.id,
    symbol: raw.symbol,
    timeframe,
    createdAt: raw.createdAt,
    side,
    direction: side === "buy" ? "up" : side === "sell" ? "down" : "flat",
    entry: raw.entry != null ? String(raw.entry) : raw.price != null ? String(raw.price) : "",
    stopLoss: raw.sl != null ? String(raw.sl) : "",
    takeProfit: raw.tp != null ? String(raw.tp) : "",
    confidence,
    riskLevel: confidence >= 70 ? "high" : confidence >= 40 ? "medium" : "low",
    reasons: [
      `${timeframe || "多周期"}结构确认`,
      side === "wait" ? "等待入场条件" : side === "buy" ? "看涨信号" : "看跌信号",
    ],
    evidence: [],
    outcome,
    pnlR: null,
    pnlPct: null,
    closedAt: raw.closedAt ?? null,
    model: "fusion-v2.1",
  };
}

function mapStats(raw: BackendStats, signals: SignalDetail[]): SignalStats {
  const bySymbol: Record<string, { total: number; win: number; winRate: number; avgR: number }> = {};
  const byTimeframe: Record<string, { total: number; win: number; winRate: number }> = {};

  for (const s of signals) {
    const sym = bySymbol[s.symbol] ?? { total: 0, win: 0, winRate: 0, avgR: 0 };
    sym.total += 1;
    if (s.outcome === "hit_tp") sym.win += 1;
    bySymbol[s.symbol] = sym;

    if (s.timeframe) {
      const tf = byTimeframe[s.timeframe] ?? { total: 0, win: 0, winRate: 0 };
      tf.total += 1;
      if (s.outcome === "hit_tp") tf.win += 1;
      byTimeframe[s.timeframe] = tf;
    }
  }

  for (const sym of Object.values(bySymbol)) {
    sym.winRate = sym.total ? sym.win / sym.total : 0;
  }
  for (const tf of Object.values(byTimeframe)) {
    tf.winRate = tf.total ? tf.win / tf.total : 0;
  }

  return {
    total: raw.total,
    win: raw.win,
    loss: raw.loss,
    pending: raw.byStatus?.open ?? 0,
    winRate: raw.winRate / 100,
    avgR: 0,
    profitFactor: 0,
    bySymbol,
    byTimeframe,
  };
}

async function fetchSignals(): Promise<SignalsPageData> {
  if (featureIsMock("signals")) return fetchMockSignals();

  const [rawSignals, rawStats] = await Promise.all([
    apiClient.get<BackendSignal[]>("/signals"),
    apiClient.get<BackendStats>("/signals/stats"),
  ]);

  const signals = rawSignals.map(mapSignal);
  return {
    signals,
    stats: mapStats(rawStats, signals),
    availableSymbols: Array.from(new Set(signals.map((s) => s.symbol))).sort(),
    availableTimeframes: Array.from(new Set(signals.map((s) => s.timeframe).filter(Boolean))).sort(),
  };
}

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: fetchSignals,
    staleTime: 30_000,
  });
}
