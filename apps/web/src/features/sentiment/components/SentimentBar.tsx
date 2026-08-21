import { cn } from "@/lib/cn";
import type { SentimentItem } from "@/features/sentiment/types";

export function SentimentBar({ item }: { item: SentimentItem }) {
  const pct = Math.max(-100, Math.min(100, item.score * 100));
  const barCls =
    pct >= 0
      ? "bg-bullish"
      : "bg-bearish";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-semibold text-text">{item.symbol}</span>
        <span
          className={cn(
            "font-mono text-xs font-semibold",
            item.label === "bullish" ? "text-bullish" : item.label === "bearish" ? "text-bearish" : "text-text-muted",
          )}
        >
          {pct >= 0 ? "+" : ""}{pct.toFixed(0)}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={cn("absolute top-0 h-full rounded-full transition-all", barCls)}
          style={{ left: pct >= 0 ? "50%" : `${50 + pct / 2}%`, width: `${Math.abs(pct) / 2}%` }}
        />
        <div className="absolute left-1/2 top-0 h-full w-px bg-border" />
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
        <span>新闻 {item.components.news.toFixed(2)}</span>
        <span>社媒 {item.components.social.toFixed(2)}</span>
        <span>{item.newsCount} 条</span>
      </div>
    </div>
  );
}
