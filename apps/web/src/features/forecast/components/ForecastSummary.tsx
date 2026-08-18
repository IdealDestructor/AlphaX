import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { ForecastData, KeyLevel } from "@/features/forecast/types";

interface Props {
  data: ForecastData;
}

const dirCfg = {
  bullish: { tone: "bull" as const, text: "看涨 Bullish" },
  bearish: { tone: "bear" as const, text: "看跌 Bearish" },
  neutral: { tone: "neutral" as const, text: "中性 Neutral" },
};

const levelCls = {
  support: "text-bullish border-[color:var(--bullish)]/30",
  resistance: "text-bearish border-[color:var(--bearish)]/30",
  pivot: "text-warning border-[color:var(--warning)]/30",
};

export function ForecastSummary({ data }: Props) {
  const day1 = data.windows[0];
  const day7 = data.windows[2];
  const day30 = data.windows[4];

  return (
    <div className="flex flex-col gap-4">
      {/* Direction + confidence */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={dirCfg[data.overallDirection].tone}>{dirCfg[data.overallDirection].text}</Badge>
        <span className="font-mono text-sm text-text-muted">
          综合置信度 · {(data.overallConfidence * 100).toFixed(0)}%
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="当前价格" value={data.currentPrice.toFixed(2)} sub={data.symbol} />
        <SummaryStat label="1 日概率" value={`${((day1?.probability ?? 0) * 100).toFixed(0)}%`} sub={`目标 ${(day1?.medianPrice ?? 0).toFixed(1)}`} tone={(day1?.probability ?? 0) >= 0.55 ? "up" : "down"} />
        <SummaryStat label="7 日概率" value={`${((day7?.probability ?? 0) * 100).toFixed(0)}%`} sub={`目标 ${(day7?.medianPrice ?? 0).toFixed(1)}`} tone={(day7?.probability ?? 0) >= 0.5 ? "up" : "down"} />
        <SummaryStat label="30 日概率" value={`${((day30?.probability ?? 0) * 100).toFixed(0)}%`} sub={`目标 ${(day30?.medianPrice ?? 0).toFixed(1)}`} tone={(day30?.probability ?? 0) >= 0.45 ? "up" : "down"} />
      </div>

      {/* Key levels */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">关键位概率</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {data.keyLevels.map((kl) => (
            <LevelCard key={kl.label} level={kl} currentPrice={data.currentPrice} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-bg/60 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div className={cn("font-mono text-lg font-semibold tabular", tone === "up" ? "text-bullish" : tone === "down" ? "text-bearish" : "text-text")}>
        {value}
      </div>
      <div className="font-mono text-xs text-text-muted">{sub}</div>
    </div>
  );
}

function LevelCard({ level, currentPrice }: { level: KeyLevel; currentPrice: number }) {
  const diff = level.price - currentPrice;
  const diffPct = (diff / currentPrice * 100).toFixed(1);
  return (
    <div className={cn("rounded-sm border px-4 py-3", levelCls[level.type])}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{level.label}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-muted">{level.type === "support" ? "支撑" : level.type === "resistance" ? "阻力" : "中枢"}</span>
      </div>
      <div className="mt-1 font-mono text-base font-semibold tabular">{level.price.toFixed(1)}</div>
      <div className="mt-0.5 flex items-center justify-between font-mono text-xs">
        <span className={diff >= 0 ? "text-bullish" : "text-bearish"}>{diff >= 0 ? "+" : ""}{diff.toFixed(1)} ({diffPct}%)</span>
        <span>{(level.probability * 100).toFixed(0)}% 概率</span>
      </div>
    </div>
  );
}
