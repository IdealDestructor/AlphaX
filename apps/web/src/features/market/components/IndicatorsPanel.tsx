import { cn } from "@/lib/cn";
import type { IndicatorSummary } from "@/features/market/types";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

const signalCls = {
  buy: "text-bullish",
  sell: "text-bearish",
  neutral: "text-text-muted",
};

const dirIcon = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

export function IndicatorsPanel({ indicators }: { indicators: IndicatorSummary[] }) {
  return (
    <div className="flex flex-col gap-1">
      {indicators.map((ind) => {
        const Icon = dirIcon[ind.direction];
        return (
          <div
            key={ind.name}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-sm px-3 py-2 hover:bg-bg-elevated/50"
          >
            <span className="text-sm text-text-secondary">{ind.name}</span>
            <span className="font-mono text-sm tabular text-text">{ind.value}</span>
            <Icon size={14} className={cn(signalCls[ind.signal])} />
          </div>
        );
      })}
    </div>
  );
}
