"use client";

import { useState, useMemo } from "react";
import { Panel } from "@/components/ui/Panel";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { NewsCard } from "@/features/news/components/NewsCard";
import { NewsFilters } from "@/features/news/components/NewsFilters";
import { NewsStats } from "@/features/news/components/NewsStats";
import { AssetSwitcher } from "@/features/dashboard/components/AssetSwitcher";
import { useNews } from "@/features/news/api";

export default function NewsPage() {
  const { data, isLoading, isError, refetch } = useNews();

  const [symbol, setSymbol] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [toneFilter, setToneFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((n) => {
      if (symbol && !n.symbols.includes(symbol)) return false;
      if (categoryFilter && n.category !== categoryFilter) return false;
      if (sourceFilter && n.source !== sourceFilter) return false;
      if (toneFilter !== "all" && n.tone !== toneFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, symbol, categoryFilter, sourceFilter, toneFilter, search]);

  if (isLoading || !data) return <SkeletonView />;
  if (isError)
    return <ErrorState title="新闻数据不可用" description="请稍后重试。" onRetry={() => refetch()} />;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <NewsStats items={data.items} filtered={filtered} />

      <AssetSwitcher
        activeSymbol={symbol || "XAUUSD"}
        onSelect={setSymbol}
      />

      <NewsFilters
        categories={data.categories}
        sources={data.sources}
        categoryFilter={categoryFilter}
        sourceFilter={sourceFilter}
        toneFilter={toneFilter}
        search={search}
        onCategoryChange={setCategoryFilter}
        onSourceChange={setSourceFilter}
        onToneChange={setToneFilter}
        onSearchChange={setSearch}
        onClear={() => {
          setSymbol("");
          setCategoryFilter("");
          setSourceFilter("");
          setToneFilter("all");
          setSearch("");
        }}
      />

      <Panel title="新闻列表" bodyClassName="p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-sm text-text-muted">
            <p>暂无匹配新闻</p>
              <button
                onClick={() => {
                  setSymbol("");
                  setCategoryFilter("");
                  setSourceFilter("");
                  setToneFilter("all");
                  setSearch("");
                }}
                className="text-accent hover:underline"
              >
                清除筛选条件
              </button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filtered.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Panel>

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的 AI 分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="h-8 animate-pulse rounded bg-bg-panel" />
      <div className="h-4 animate-pulse rounded bg-bg-panel" />
      <Panel title="新闻列表">
        <SkeletonPanel lines={8} />
      </Panel>
    </div>
  );
}
