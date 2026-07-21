"use client";

import type { AiNewsItem } from "../types";

export function NewsStats({ items, filtered }: { items: AiNewsItem[]; filtered: AiNewsItem[] }) {
  const bullish = items.filter((n) => n.tone === "bullish").length;
  const bearish = items.filter((n) => n.tone === "bearish").length;
  const neutral = items.filter((n) => n.tone === "neutral").length;
  const highImpact = items.filter((n) => n.impact === "high").length;

  return (
    <div className="flex flex-wrap gap-4 text-xs text-text-muted">
      <span>共 {items.length} 条新闻</span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-bullish" />
        利多 {bullish}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-bearish" />
        利空 {bearish}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2 w-2 rounded-full bg-text-muted" />
        中性 {neutral}
      </span>
      <span>
        重要 {highImpact}
      </span>
      {filtered.length < items.length && (
        <span className="text-accent">已筛选 {filtered.length}/{items.length}</span>
      )}
    </div>
  );
}
