"use client";

import { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ErrorState, SkeletonPanel } from "@/components/state/States";
import { MarketHeader } from "@/features/market/components/MarketHeader";
import { MarketChart } from "@/features/market/components/MarketChart";
import { MarketStats } from "@/features/market/components/MarketStats";
import { TimeframeSwitcher } from "@/features/market/components/TimeframeSwitcher";
import { IndicatorsPanel } from "@/features/market/components/IndicatorsPanel";
import { useMarketData } from "@/features/market/api";
import { AiAnalysisCard } from "@/features/dashboard/components/AiAnalysisCard";
import { useDashboard } from "@/features/dashboard/api";
import { getAssetInfo } from "@/lib/assets";
import { useSymbol } from "@/lib/symbol-context";
import type { Timeframe } from "@/features/market/types";
import { RefreshCw, BrainCircuit } from "lucide-react";

const VALID_SYMBOLS = ["XAUUSD", "XAGUSD", "DXY", "US10Y", "BTCUSD", "VIX", "NAS100", "SPX500", "WTI", "BRENT", "GLD", "SLV", "SPY"];

export default function MarketPage({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();

  if (!VALID_SYMBOLS.includes(symbol)) {
    notFound();
  }

  return <MarketContent symbol={symbol} />;
}

function MarketContent({ symbol }: { symbol: string }) {
  const [tf, setTf] = useState<Timeframe>("1H");
  const [showIndicators, setShowIndicators] = useState(true);
  const { setCurrentSymbol } = useSymbol();
  const router = useRouter();

  useEffect(() => { setCurrentSymbol(symbol); }, [symbol, setCurrentSymbol]);

  const { data, isLoading, isError, refetch } = useMarketData(symbol, tf);
  const dashboardQuery = useDashboard(symbol);
  const info = getAssetInfo(symbol);

  if (isLoading || !data)
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <div className="h-24 animate-pulse rounded-lg bg-bg-panel" />
        <div className="h-[480px] animate-pulse rounded-lg bg-bg-panel" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-40 animate-pulse rounded-lg bg-bg-panel" />
          <div className="h-40 animate-pulse rounded-lg bg-bg-panel" />
        </div>
      </div>
    );

  if (isError)
    return (
      <ErrorState
        title="行情数据不可用"
        description={`${symbol} 在 ${tf} 周期数据加载失败，请重试。`}
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">

      {/* Header */}
      <MarketHeader
        quote={data.quote}
        symbolName={data.symbol.name}
        group={data.symbol.group}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TimeframeSwitcher value={tf} onChange={setTf} />
        <div className="flex items-center gap-2">
          <Button
            variant={showIndicators ? "primary" : "secondary"}
            onClick={() => setShowIndicators((v) => !v)}
          >
            <BrainCircuit size={14} />
            指标
          </Button>
          <Button variant="ghost" onClick={() => refetch()}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">刷新</span>
          </Button>
        </div>
      </div>

      {/* Chart + Indicators */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <Panel title={`${info.icon} ${info.name} K 线图`} subtitle={`${symbol} · ${tf}`} bodyClassName="p-1">
          <MarketChart candles={data.candles} timeframe={tf} />
        </Panel>

        {showIndicators && (
          <Panel title="技术指标">
            <IndicatorsPanel indicators={data.indicators} />
          </Panel>
        )}
      </div>

      {/* Stats */}
      <Panel title="市场数据">
        <MarketStats quote={data.quote} />
      </Panel>

      {/* AI Analysis card (from dashboard hook) */}
      {dashboardQuery.data && (
        <Panel
          title="AI 分析"
          subtitle={`${symbol} · 融合决策`}
          className="border-t-2 border-t-accent"
        >
          <AiAnalysisCard
            data={{
              ...dashboardQuery.data.analysis,
              symbol,
            }}
          />
        </Panel>
      )}

      <p className="mt-1 border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的 AI 分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}
