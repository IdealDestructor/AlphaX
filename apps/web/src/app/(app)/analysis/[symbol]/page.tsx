"use client";

import { notFound, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { ErrorState, SkeletonPanel } from "@/components/state/States";
import { AnalysisOverview } from "@/features/analysis/components/AnalysisOverview";
import { EvidenceChainDetail } from "@/features/analysis/components/EvidenceChainDetail";
import { AnalysisHistory } from "@/features/analysis/components/AnalysisHistory";
import { useAnalysis } from "@/features/analysis/api";
import { useSymbol } from "@/lib/symbol-context";
import type { Timeframe } from "@/features/analysis/types";
import { getAssetInfo } from "@/lib/assets";
import { BrainCircuit, History, Scale } from "lucide-react";

const VALID_SYMBOLS = ["XAUUSD", "XAGUSD", "DXY", "US10Y", "BTCUSD", "VIX", "NAS100", "SPX500", "WTI", "BRENT", "GLD", "SLV", "SPY"];
const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "15m", label: "15m" },
  { key: "1H", label: "1H" },
  { key: "4H", label: "4H" },
  { key: "1D", label: "Daily" },
];

const TABS = [
  { key: "overview", label: "分析摘要", icon: BrainCircuit },
  { key: "evidence", label: "证据链", icon: Scale },
  { key: "history", label: "历史记录", icon: History },
] as const;

export default function AnalysisPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  if (!VALID_SYMBOLS.includes(symbol)) notFound();
  return <AnalysisContent symbol={symbol} />;
}

function AnalysisContent({ symbol }: { symbol: string }) {
  const [tf, setTf] = useState<Timeframe>("4H");
  const [tab, setTab] = useState<string>("overview");
  const { data, isLoading, isError, refetch } = useAnalysis(symbol);
  const { setCurrentSymbol } = useSymbol();
  const router = useRouter();
  const info = getAssetInfo(symbol);

  useEffect(() => { setCurrentSymbol(symbol); }, [symbol, setCurrentSymbol]);

  if (isLoading || !data) return <SkeletonView symbol={symbol} />;
  if (isError)
    return (
      <ErrorState
        title="智能分析不可用"
        description="分析服务暂时不可用，请稍后重试。"
        onRetry={() => refetch()}
      />
    );

  const tfSelector = (
    <div className="inline-flex border border-border bg-bg">
      {TIMEFRAMES.map((t) => (
        <button
          key={t.key}
          onClick={() => setTf(t.key)}
          className={`h-7 border-r border-border px-2.5 font-mono text-[11px] last:border-r-0 ${
            tf === t.key
              ? "bg-bg-elevated font-semibold text-text"
              : "text-text-muted hover:text-text hover:bg-bg-elevated/50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">
            {info.icon} {info.name} · {symbol}
          </h1>
          <p className="mt-0.5 text-sm text-text-muted">AI 市场分析 · {data.availableTimeframes.join(" / ")}</p>
        </div>
        {tfSelector}
      </div>

      {/* Accuracy mini summary */}
      <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <AccStat label="总信号" value={String(data.accuracy.total)} />
        <AccStat label="胜率" value={`${(data.accuracy.winRate * 100).toFixed(0)}%`} tone="bullish" />
        <AccStat label="平均 R" value={data.accuracy.avgR.toFixed(2)} tone="bullish" />
        <AccStat label="4H 胜率" value={`${(data.accuracy.byTimeframe["4H"]?.winRate ?? 0 * 100).toFixed(0)}%`} tone="bullish" />
      </div>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Overview tab */}
      {tab === "overview" && (
        <Panel title={`${info.icon} ${info.name} 智能分析`} subtitle={`${symbol} · ${tf}`} className="border-t-2 border-t-accent">
          <AnalysisOverview entry={data.current} onRefresh={() => refetch()} />
        </Panel>
      )}

      {/* Evidence tab */}
      {tab === "evidence" && (
        <Panel title="证据链详情" subtitle="各 Agent 信号来源与权重">
          <EvidenceChainDetail entry={data.current} />
        </Panel>
      )}

      {/* History tab */}
      {tab === "history" && (
        <Panel title="历史智能分析" subtitle="近 7 天所有分析记录">
          <AnalysisHistory history={data.history} />
        </Panel>
      )}

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

function AccStat({ label, value, tone }: { label: string; value: string; tone?: "bullish" | "bearish" }) {
  return (
    <div className="bg-bg-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className={`font-mono text-lg font-semibold tabular ${tone === "bullish" ? "text-bullish" : tone === "bearish" ? "text-bearish" : "text-text"}`}>
        {value}
      </div>
    </div>
  );
}

function SkeletonView({ symbol }: { symbol: string }) {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="h-10 animate-pulse rounded bg-bg-panel" />
      <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse bg-bg-panel" />
        ))}
      </div>
      <div className="h-10 animate-pulse rounded bg-bg-panel" />
      <Panel title="加载中">
        <SkeletonPanel lines={8} />
      </Panel>
    </div>
  );
}
