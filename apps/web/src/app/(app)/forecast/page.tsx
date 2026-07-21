"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { ForecastChart } from "@/features/forecast/components/ForecastChart";
import { ForecastTable } from "@/features/forecast/components/ForecastTable";
import { ForecastSummary } from "@/features/forecast/components/ForecastSummary";
import { useForecast } from "@/features/forecast/api";
import { useSymbol } from "@/lib/symbol-context";
import { BarChart3, Table2, TrendingUp } from "lucide-react";

const PAGE_TABS = [
  { key: "summary", label: "总览", icon: TrendingUp },
  { key: "chart", label: "概率锥", icon: BarChart3 },
  { key: "table", label: "详细数据", icon: Table2 },
] as const;

export default function ForecastPage() {
  const { currentSymbol: symbol } = useSymbol();
  const [tab, setTab] = useState("summary");
  const { data, isLoading, isError, refetch } = useForecast(symbol);

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">

      {isLoading || !data ? (
        <SkeletonView />
      ) : isError ? (
        <ErrorState title="预测数据不可用" description="请稍后重试。" onRetry={() => refetch()} />
      ) : (
        <>
          {/* Access banner */}
          <div className="flex items-center gap-3 border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/5 px-4 py-3 text-sm text-text-secondary">
            <TrendingUp size={16} className="shrink-0 text-accent" />
            <span>概率预测为 Pro 功能。当前为预览视图，完整时间窗与历史回测数据需升级 Pro。</span>
          </div>

          <Tabs tabs={PAGE_TABS} active={tab} onChange={setTab} />

          {tab === "summary" && (
            <Panel title="预测总览" subtitle={`${symbol} · ${data.forecast.currentPrice.toFixed(2)}`}>
              <ForecastSummary data={data.forecast} />
            </Panel>
          )}

          {tab === "chart" && (
            <Panel title="概率锥形图" subtitle={`${symbol} · 1–30 日价格分布`} bodyClassName="p-1">
              <ForecastChart data={data.forecast} />
            </Panel>
          )}

          {tab === "table" && (
            <Panel title="详细预测数据" subtitle={`${symbol} · 各周期概率与区间`}>
              <ForecastTable windows={data.forecast.windows} currentPrice={data.forecast.currentPrice} />
            </Panel>
          )}
        </>
      )}

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：概率预测基于历史数据与 AI 模型生成，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-10 animate-pulse rounded bg-bg-panel" />
      <div className="h-12 animate-pulse rounded bg-bg-panel" />
      <Panel title="加载中">
        <SkeletonPanel lines={6} />
      </Panel>
    </div>
  );
}
