import { cn } from "@/lib/cn";
import type { JournalStats } from "@/features/journal/types";

export function JournalStatsPanel({ stats }: { stats: JournalStats }) {
  const cards = [
    { label: "总交易", value: String(stats.totalTrades), tone: "text-text" as const },
    { label: "胜率", value: `${stats.winRate}%`, tone: (stats.winRate >= 50 ? "text-bullish" : "text-bearish") as "text-bullish" | "text-bearish" },
    { label: "累计盈亏", value: `${stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit}`, tone: (stats.totalProfit >= 0 ? "text-bullish" : "text-bearish") as "text-bullish" | "text-bearish" },
    { label: "平均盈亏", value: `${stats.averageProfit >= 0 ? "+" : ""}${stats.averageProfit}`, tone: (stats.averageProfit >= 0 ? "text-bullish" : "text-bearish") as "text-bullish" | "text-bearish" },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-bg-panel px-4 py-3">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">{c.label}</div>
          <div className={cn("font-mono text-lg font-semibold tabular", c.tone)}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
