"use client";

import { Panel } from "@/components/ui/Panel";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { KpiStrip } from "@/features/dashboard/components/KpiStrip";
import { TickerStrip } from "@/features/dashboard/components/TickerStrip";
import { AiAnalysisCard } from "@/features/dashboard/components/AiAnalysisCard";
import { PriceChart } from "@/features/dashboard/components/PriceChart";
import { SignalsTable } from "@/features/dashboard/components/SignalsTable";
import { SentimentPanel } from "@/features/dashboard/components/SentimentPanel";
import { NewsList } from "@/features/dashboard/components/NewsList";
import { useDashboard } from "@/features/dashboard/api";
import { getAssetInfo } from "@/lib/assets";
import { useSymbol } from "@/lib/symbol-context";

export default function DashboardPage() {
  const { currentSymbol: symbol } = useSymbol();
  const { data, isLoading, isError, refetch } = useDashboard(symbol);

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      {isLoading || !data ? (
        <LoadingView />
      ) : isError ? (
        <ErrorState
          title="分析服务暂时不可用"
          description="上游超时。已保留上次有效结论的缓存不可用。"
          onRetry={() => refetch()}
        />
      ) : (
        <PopulatedView data={data} symbol={symbol} />
      )}
    </div>
  );
}

function PopulatedView({ data, symbol }: { data: NonNullable<ReturnType<typeof useDashboard>["data"]>; symbol: string }) {
  const info = getAssetInfo(symbol);
  return (
    <>
      <TickerStrip items={data.ticker} />
      <KpiStrip kpi={data.kpi} symbol={symbol} />

      <Panel title="新闻摘要">
        <NewsList items={data.news} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title={`${info.icon} ${info.name} 智能分析`}
          subtitle={`${symbol} · 可解释决策`}
          className="border-t-2 border-t-accent"
        >
          <AiAnalysisCard data={data.analysis} />
        </Panel>
        <Panel title="价格走势" subtitle={`${symbol} · 1H`}>
          <PriceChart symbol={symbol} timeframe="1H" />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Panel title="近期交易信号">
          <SignalsTable rows={data.signals} />
        </Panel>
        <Panel title="市场情绪">
          <SentimentPanel data={data.sentiment} />
        </Panel>
      </div>

      <p className="mt-1 border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </>
  );
}

function LoadingView() {
  return (
    <>
      <div className="h-8 animate-pulse rounded bg-bg-elevated" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[104px] animate-pulse rounded-lg bg-bg-panel" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel title="AI 市场分析">
          <SkeletonPanel lines={6} />
        </Panel>
        <Panel title="价格走势">
          <div className="h-[280px] animate-pulse rounded-md bg-bg-elevated" />
        </Panel>
      </div>
    </>
  );
}
