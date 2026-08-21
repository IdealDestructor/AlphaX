import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import type { SmartMoneyItem } from "@/features/smart-money/types";

const fmt = (n: number) => (n >= 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

export function SmartMoneyCard({ item }: { item: SmartMoneyItem }) {
  const dir = item.signal.direction;
  const tone: "bull" | "bear" | "neutral" =
    dir === "accumulate" ? "bull" : dir === "distribute" ? "bear" : "neutral";
  const label = dir === "accumulate" ? "吸筹" : dir === "distribute" ? "派发" : "中性";

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-sm font-semibold text-text">{item.symbol}</span>
          <span className="ml-2 text-xs text-text-muted">Smart Money</span>
        </div>
        <Badge tone={tone}>
          {label} · {(item.signal.strength * 100).toFixed(0)}%
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="ETF 净流入" value={fmt(item.etf.netFlow)} tone={item.etf.netFlow >= 0 ? "bull" : "bear"} />
        <MiniStat label="COT 净多" value={fmt(item.cot.netSpecLong / 1000)} suffix="k" tone={item.cot.netSpecLong >= 0 ? "bull" : "bear"} />
        <MiniStat label="央行购金" value={`${item.centralBank.purchasesTonnes}`} suffix="t" tone="neutral" />
      </div>

      <div className="grid grid-cols-2 gap-x-3 text-xs text-text-muted">
        <span>ETF 累计：{fmt(item.etf.cumulative)}</span>
        <span>央行趋势：{item.centralBank.trend === "accumulating" ? "持续增持" : "中性"}</span>
        <span>投机多头：{(item.cot.specLong / 1000).toFixed(0)}k</span>
        <span>投机空头：{(item.cot.specShort / 1000).toFixed(0)}k</span>
      </div>

      <div className="flex items-center gap-2 border-t border-border-subtle pt-2 text-[10px] text-text-muted">
        <span className={cn("rounded-full border px-2 py-0.5 font-mono uppercase tracking-wider", item.sources.cot === "cftc" ? "border-bullish/40 text-bullish" : "border-border text-text-muted")}>
          COT：{item.sources.cot === "cftc" ? "CFTC 真实" : "估算"}
        </span>
        <span>ETF / 央行：估算</span>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  tone: "bull" | "bear" | "neutral";
}) {
  return (
    <div className="rounded-sm border border-border-subtle bg-bg/40 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
      <div
        className={cn(
          "font-mono text-sm font-semibold tabular",
          tone === "bull" ? "text-bullish" : tone === "bear" ? "text-bearish" : "text-text",
        )}
      >
        {value}
        {suffix ? <span className="ml-0.5 text-[10px] text-text-muted">{suffix}</span> : null}
      </div>
    </div>
  );
}

