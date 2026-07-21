import { cn } from "@/lib/cn";
import type { AnalysisEntry } from "@/features/analysis/types";

const outcomeCfg = {
  hit_tp: { label: "止盈", cls: "text-bullish bg-[color:var(--bullish)]/8 border-[color:var(--bullish)]/30" },
  hit_sl: { label: "止损", cls: "text-bearish bg-[color:var(--bearish)]/8 border-[color:var(--bearish)]/30" },
  pending: { label: "进行中", cls: "text-warning bg-[color:var(--warning)]/8 border-[color:var(--warning)]/30" },
  expired: { label: "已过期", cls: "text-text-muted bg-bg border-border" },
  invalid: { label: "无效", cls: "text-text-muted bg-bg border-border" },
};

interface Props {
  history: AnalysisEntry[];
}

export function AnalysisHistory({ history }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {history.map((h) => {
        const oc = h.outcome ? outcomeCfg[h.outcome.result] : outcomeCfg.pending;
        const time = new Date(h.createdAt);
        return (
          <div
            key={h.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-sm border border-border-subtle bg-bg/30 px-4 py-3 hover:bg-bg-elevated/50"
          >
            {/* Time */}
            <div className="text-center font-mono text-xs text-text-muted">
              <div>{time.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}</div>
              <div>{time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}</div>
            </div>

            {/* Body */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("font-mono text-xs", h.trend === "bullish" ? "text-bullish" : h.trend === "bearish" ? "text-bearish" : "text-text-muted")}>
                  {h.trend === "bullish" ? "↑" : h.trend === "bearish" ? "↓" : "·"} {h.trend.toUpperCase()}
                </span>
                <span className="font-mono text-xs text-text-muted">{h.timeframe}</span>
                <span className="font-mono text-xs tabular text-text">{h.confidence}%</span>
                <span className="text-xs text-text-muted">→</span>
                <span className={cn("text-xs", h.action === "buy" ? "text-bullish" : h.action === "sell" ? "text-bearish" : "text-warning")}>
                  {h.action.toUpperCase()}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-text-muted">
                {h.reasons.slice(0, 2).join(" · ")}
              </p>
            </div>

            {/* Outcome */}
            <div className={cn("flex shrink-0 flex-col items-end gap-0.5 rounded-sm border px-2.5 py-1.5", oc.cls)}>
              <span className="font-mono text-xs font-semibold">{oc.label}</span>
              {h.outcome?.pnlR != null && (
                <span className={cn("font-mono text-[11px]", h.outcome.pnlR >= 0 ? "text-bullish" : "text-bearish")}>
                  {h.outcome.pnlR >= 0 ? "+" : ""}{h.outcome.pnlR.toFixed(1)}R
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
