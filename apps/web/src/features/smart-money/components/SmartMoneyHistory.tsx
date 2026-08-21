import { cn } from "@/lib/cn";
import type { SmartMoneyHistoryPoint } from "@/features/smart-money/types";

export function SmartMoneyHistory({ history }: { history: SmartMoneyHistoryPoint[] }) {
  const etfs = history.map((h) => h.etf);
  const maxAbs = Math.max(1, ...etfs.map((v) => Math.abs(v)));

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-wider text-text-muted">ETF 净流入（近 14 日）</div>
      <div className="flex h-24 items-end gap-1">
        {history.map((h) => {
          const hPct = (h.etf / maxAbs) * 100;
          return (
            <div key={h.date} className="flex flex-1 flex-col items-center gap-1" title={`${h.date} · ${h.etf}`}>
              <div
                className={cn("w-full rounded-sm", h.etf >= 0 ? "bg-bullish/80" : "bg-bearish/80")}
                style={{ height: `${Math.max(2, Math.abs(hPct))}%` }}
              />
              <span className="font-mono text-[9px] text-text-muted">{h.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
