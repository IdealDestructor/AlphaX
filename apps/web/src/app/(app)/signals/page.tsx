"use client";

import { useState, useMemo } from "react";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { SignalFilters } from "@/features/signals/components/SignalFilters";
import { SignalList } from "@/features/signals/components/SignalList";
import { SignalStats } from "@/features/signals/components/SignalStats";
import { useSignals } from "@/features/signals/api";
import { useSymbol } from "@/lib/symbol-context";
import type { Action } from "@/features/signals/types";
import { List, BarChart3 } from "lucide-react";

const PAGE_TABS = [
  { key: "list", label: "信号列表", icon: List },
  { key: "stats", label: "准确率统计", icon: BarChart3 },
] as const;

export default function SignalsPage() {
  const { data, isLoading, isError, refetch } = useSignals();

  const { currentSymbol } = useSymbol();
  const [symbolFilter, setSymbolFilter] = useState(currentSymbol);
  const [sideFilter, setSideFilter] = useState<Action | "all">("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("list");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.signals.filter((s) => {
      if (symbolFilter && s.symbol !== symbolFilter) return false;
      if (sideFilter !== "all" && s.side !== sideFilter) return false;
      if (outcomeFilter !== "all" && s.outcome !== outcomeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.symbol.toLowerCase().includes(q) || s.reasons.some((r) => r.includes(q));
      }
      return true;
    });
  }, [data, symbolFilter, sideFilter, outcomeFilter, search]);

  if (isLoading || !data) return <SkeletonView />;
  if (isError)
    return <ErrorState title="信号数据不可用" description="请稍后重试。" onRetry={() => refetch()} />;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <Tabs tabs={PAGE_TABS} active={tab} onChange={setTab} />

      {tab === "stats" && (
        <Panel title="准确率统计">
          <SignalStats stats={data.stats} />
        </Panel>
      )}

      {tab === "list" && (
        <>
          <SignalFilters
            symbols={data.availableSymbols}
            symbolFilter={symbolFilter}
            sideFilter={sideFilter}
            outcomeFilter={outcomeFilter}
            search={search}
            onSymbolChange={setSymbolFilter}
            onSideChange={setSideFilter}
            onOutcomeChange={setOutcomeFilter}
            onSearchChange={setSearch}
            onClear={() => {
              setSymbolFilter("");
              setSideFilter("all");
              setOutcomeFilter("all");
              setSearch("");
            }}
          />
          {(() => {
            const sub = filtered.length < data.signals.length ? `已筛选 ${filtered.length}/${data.signals.length}` : undefined;
            return (
              <Panel title="信号列表" {...(sub ? { subtitle: sub } : {})}>
                <SignalList signals={filtered} />
              </Panel>
            );
          })()}
        </>
      )}

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="h-10 animate-pulse rounded bg-bg-panel" />
      <div className="grid grid-cols-5 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse bg-bg-panel" />
        ))}
      </div>
      <Panel title="加载中">
        <SkeletonPanel lines={6} />
      </Panel>
    </div>
  );
}
