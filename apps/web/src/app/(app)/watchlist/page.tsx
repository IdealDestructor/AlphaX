"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { SkeletonPanel, ErrorState, EmptyState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from "@/features/watchlist/api";
import { useMarketSymbols, useMarketQuotes } from "@/features/market/api";
import { useMyEntitlements } from "@/features/billing/api";
import { Plus, Star, ArrowUpRight } from "lucide-react";

const ASSET_CLASS_LABEL: Record<string, string> = {
  metals: "贵金属",
  crypto: "加密货币",
  forex: "外汇",
  indices: "股指",
  commodities: "大宗商品",
  etf: "ETF",
};

function WatchlistContent() {
  const watchlist = useWatchlist();
  const symbolsQuery = useMarketSymbols();
  const entitlements = useMyEntitlements();
  const add = useAddToWatchlist();
  const remove = useRemoveFromWatchlist();

  const [selected, setSelected] = useState("");

  const codes = useMemo(() => (watchlist.data?.items ?? []).map((i) => i.symbol), [watchlist.data]);
  const quotes = useMarketQuotes(codes);

  if (watchlist.isLoading || symbolsQuery.isLoading || !watchlist.data || !symbolsQuery.data) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <Panel title="自选">
          <SkeletonPanel lines={6} />
        </Panel>
      </div>
    );
  }

  if (watchlist.isError) {
    return (
      <ErrorState
        title="自选数据不可用"
        description="请稍后重试。"
        onRetry={() => watchlist.refetch()}
      />
    );
  }

  const owned = new Set(watchlist.data.items.map((i) => i.symbol));
  const available = symbolsQuery.data.filter((s) => !owned.has(s.code));
  const quota = entitlements.data?.quota.watchlist;
  const used = watchlist.data.items.length;
  const atQuota = quota != null && used >= quota;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">自选</h1>
          <p className="mt-0.5 text-sm text-text-muted">
            {quota != null ? `已用 ${used}/${quota} 个标的` : `${used} 个标的`} · 实时行情 {quotes.data?.length ?? 0}/{codes.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="h-9 border border-border bg-bg-panel px-3 text-sm text-text outline-none focus:border-accent"
            disabled={atQuota || available.length === 0}
          >
            <option value="">
              {atQuota ? "已达配额上限" : available.length === 0 ? "没有更多标的" : "选择标的加入…"}
            </option>
            {available.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            disabled={!selected || atQuota}
            onClick={() => {
              if (!selected) return;
              add.mutate(selected);
              setSelected("");
            }}
          >
            <Plus size={14} />
            添加
          </Button>
        </div>
      </div>

      <Panel title="我的自选" tools={<Star size={14} className="text-text-muted" />}>
        {watchlist.data.items.length === 0 ? (
          <EmptyState
            title="自选还是空的"
            description="从右侧选择标的加入自选，实时跟踪行情。"
          />
        ) : (
          <div className="flex flex-col">
            {watchlist.data.items.map((item) => {
              const q = quotes.data?.find((x) => x.symbol === item.symbol);
              return (
                <div
                  key={item.symbol}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0 hover:bg-bg-elevated/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/market/${item.symbol}`} className="font-mono text-sm font-semibold text-text hover:text-accent">
                        {item.symbol}
                      </Link>
                      <span className="truncate text-xs text-text-muted">{item.name}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
                      {ASSET_CLASS_LABEL[item.assetClass] ?? item.assetClass}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {q ? (
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold tabular text-text">{q.price.toFixed(2)}</div>
                        <div className={`font-mono text-[11px] tabular ${q.changePct >= 0 ? "text-bullish" : "text-bearish"}`}>
                          {q.changePct >= 0 ? "+" : ""}
                          {q.changePct.toFixed(2)}%
                        </div>
                      </div>
                    ) : (
                      <div className="h-8 w-16 animate-pulse rounded bg-bg-elevated" />
                    )}
                    <Link
                      href={`/market/${item.symbol}`}
                      className="grid h-7 w-7 place-items-center text-text-muted hover:bg-bg-elevated hover:text-text"
                      aria-label={`查看 ${item.symbol}`}
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                    <button
                      onClick={() => remove.mutate(item.symbol)}
                      disabled={remove.isPending}
                      className="grid h-7 w-7 place-items-center text-text-muted hover:bg-bg-elevated hover:text-danger"
                      aria-label={`移除 ${item.symbol}`}
                    >
                      <Star size={14} className="fill-current" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      {atQuota && (
        <div className="rounded-sm border border-warning/40 bg-warning/10 px-4 py-3 text-xs text-warning">
          已达免费版自选配额（{quota} 个）。升级 Pro 可将自选上限提升至 50。
          <Link href="/billing" className="ml-2 underline">
            去升级 →
          </Link>
        </div>
      )}

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <RequireAuth>
      <WatchlistContent />
    </RequireAuth>
  );
}
