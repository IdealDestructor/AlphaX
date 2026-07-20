import { cn } from "@/lib/cn";
import type { TickerItem } from "@/features/dashboard/types";

const dirCls = {
  up: "text-bullish",
  down: "text-bearish",
  flat: "text-text-muted",
};

export function TickerStrip({ items }: { items: TickerItem[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto border-b border-border py-2">
      {items.map((t) => (
        <div key={t.symbol} className="flex shrink-0 items-baseline gap-2 font-mono text-sm">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {t.symbol}
          </span>
          <span className="text-text tabular">{t.price}</span>
          <span className={cn("tabular", dirCls[t.direction])}>{t.change}</span>
        </div>
      ))}
    </div>
  );
}
