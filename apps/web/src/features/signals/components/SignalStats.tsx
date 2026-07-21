import { cn } from "@/lib/cn";
import type { SignalStats } from "@/features/signals/types";

interface Props {
  stats: SignalStats;
}

export function SignalStats({ stats }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top-level stats */}
      <div className="grid grid-cols-5 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <Stat label="总信号" value={String(stats.total)} />
        <Stat label="胜率" value={`${(stats.winRate * 100).toFixed(0)}%`} tone={stats.winRate >= 0.6 ? "bullish" : "bearish"} />
        <Stat label="平均 R" value={stats.avgR >= 0 ? `+${stats.avgR}` : String(stats.avgR)} tone={stats.avgR >= 0 ? "bullish" : "bearish"} />
        <Stat label="获利因子" value={String(stats.profitFactor)} tone="bullish" />
        <Stat label="进行中" value={String(stats.pending)} tone="neutral" />
      </div>

      {/* By symbol */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">按品种</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(stats.bySymbol).map(([sym, s]) => (
            <MiniStat key={sym} label={sym} value={`${(s.winRate * 100).toFixed(0)}%`} sub={`${s.win}/${s.total}`} tone={s.winRate >= 0.6 ? "bullish" : "bearish"} />
          ))}
        </div>
      </div>

      {/* By timeframe */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">按周期</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(stats.byTimeframe).map(([tf, s]) => (
            <MiniStat key={tf} label={tf} value={`${(s.winRate * 100).toFixed(0)}%`} sub={`${s.win}/${s.total}`} tone={s.winRate >= 0.6 ? "bullish" : "bearish"} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bullish" | "bearish" | "neutral" }) {
  return (
    <div className="bg-bg-panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className={cn(
        "font-mono text-lg font-semibold tabular",
        tone === "bullish" ? "text-bullish" : tone === "bearish" ? "text-bearish" : "text-text",
      )}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-bg/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className={cn("font-mono text-sm font-semibold tabular", tone === "bullish" ? "text-bullish" : "text-bearish")}>
        {value}
      </div>
      <div className="font-mono text-[11px] text-text-muted">{sub}</div>
    </div>
  );
}
