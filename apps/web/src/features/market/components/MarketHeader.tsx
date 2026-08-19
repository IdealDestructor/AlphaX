"use client";

import { cn } from "@/lib/cn";
import type { Quote } from "@/features/market/types";
import { SOURCE_LABELS } from "@/features/market/types";
import { Star } from "lucide-react";

interface Props {
  quote: Quote;
  symbolName: string;
  group: string;
}

export function MarketHeader({ quote, symbolName, group }: Props) {
  const isUp = quote.change >= 0;
  const changeCls = isUp ? "text-bullish" : "text-bearish";
  const arrow = isUp ? "▲" : "▼";
  const isReal = quote.source !== undefined && quote.source !== "mock";
  const sourceLabel = quote.source ? SOURCE_LABELS[quote.source] : "模拟数据";

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="m-0 text-xl font-semibold tracking-tight">{quote.symbol}</h1>
          <button
            className="text-text-muted hover:text-accent transition-colors"
            aria-label="加入自选"
          >
            <Star size={16} />
          </button>
          <span className="rounded-sm border border-border bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">
            {group}
          </span>
          {isReal ? (
            <span
              className="rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-500"
              title={`数据来自 ${sourceLabel} 实时行情`}
            >
              实时 · {sourceLabel}
            </span>
          ) : (
            <span
              className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-500"
              title="该标的暂无真实数据源, 展示模拟数据"
            >
              模拟数据
            </span>
          )}
        </div>
        <p className="m-0 text-sm text-text-secondary">{symbolName}</p>
      </div>

      <div className="flex flex-wrap items-baseline gap-4">
        <div className="text-right">
          <div className="font-mono text-[34px] font-semibold leading-none tracking-tight tabular">
            {quote.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className={cn("font-mono text-sm tabular", changeCls)}>
            {arrow} {quote.change >= 0 ? "+" : ""}
            {quote.change.toFixed(2)} ({quote.changePct >= 0 ? "+" : ""}
            {quote.changePct.toFixed(2)}%)
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono tabular">
          <span className="text-text-muted">Bid</span>
          <span className="text-right text-text">{quote.bid.toFixed(2)}</span>
          <span className="text-text-muted">Ask</span>
          <span className="text-right text-text">{quote.ask.toFixed(2)}</span>
          <span className="text-text-muted">Spread</span>
          <span className="text-right text-text">
            {((quote.ask - quote.bid) / quote.ask * 10000).toFixed(1)} bp
          </span>
        </div>
      </div>
    </div>
  );
}
