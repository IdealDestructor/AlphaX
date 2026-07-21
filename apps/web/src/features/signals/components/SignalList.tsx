import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import type { SignalDetail } from "@/features/signals/types";

const sideCls = {
  buy: "text-bullish",
  sell: "text-bearish",
  wait: "text-warning",
};
const sideLabel = {
  buy: "↑ 买入",
  sell: "↓ 卖出",
  wait: "· 观望",
};

const outcomeCls: Record<string, string> = {
  hit_tp: "text-bullish bg-[color:var(--bullish)]/8 border-[color:var(--bullish)]/30",
  hit_sl: "text-bearish bg-[color:var(--bearish)]/8 border-[color:var(--bearish)]/30",
  pending: "text-warning bg-[color:var(--warning)]/8 border-[color:var(--warning)]/30",
  expired: "text-text-muted bg-bg border-border",
};
const outcomeLabel: Record<string, string> = {
  hit_tp: "止盈",
  hit_sl: "止损",
  pending: "进行中",
  expired: "已过期",
};

interface Props {
  signals: SignalDetail[];
}

export function SignalList({ signals }: Props) {
  if (!signals.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted">
        <div className="grid h-10 w-10 place-items-center border border-border bg-bg">?</div>
        <p className="text-sm">没有匹配的信号</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {signals.map((s) => (
        <SignalRow key={s.id} signal={s} />
      ))}
    </div>
  );
}

function SignalRow({ signal: s }: { signal: SignalDetail }) {
  const [open, setOpen] = useState(false);
  const ago = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 3600000);
  const agoLabel = ago < 1 ? "<1h" : ago < 24 ? `${ago}h` : `${Math.floor(ago / 24)}d`;

  return (
    <div className="rounded-sm border border-border-subtle bg-bg/40 transition-colors hover:bg-bg-elevated/50">
      {/* Summary row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        {/* Time */}
        <span className="w-10 shrink-0 font-mono text-xs text-text-muted">{agoLabel}</span>

        {/* Symbol */}
        <span className="w-14 shrink-0 font-medium text-sm text-text">{s.symbol}</span>

        {/* Direction */}
        <span className={cn("w-16 shrink-0 font-mono text-xs font-semibold", sideCls[s.side])}>
          {sideLabel[s.side]}
        </span>

        {/* Entry */}
        <span className="w-20 shrink-0 font-mono text-xs tabular text-text-secondary">{s.entry}</span>

        {/* Confidence */}
        <span className="flex w-24 shrink-0 items-center gap-1.5 font-mono text-xs">
          {s.confidence}%
          <span className="h-[3px] w-10 overflow-hidden rounded-full bg-border">
            <span className="block h-full bg-accent" style={{ width: `${s.confidence}%` }} />
          </span>
        </span>

        {/* Timeframe */}
        <span className="w-10 shrink-0 font-mono text-xs text-text-muted">{s.timeframe}</span>

        {/* Outcome */}
        <span className={cn("ml-auto rounded-sm border px-2 py-0.5 font-mono text-xs font-semibold", outcomeCls[s.outcome])}>
          {outcomeLabel[s.outcome]}
          {s.pnlR != null && (
            <span className={cn("ml-1", s.pnlR >= 0 ? "text-bullish" : "text-bearish")}>
              {s.pnlR >= 0 ? "+" : ""}{s.pnlR.toFixed(1)}R
            </span>
          )}
        </span>

        {open ? <ChevronUp size={14} className="shrink-0 text-text-muted" /> : <ChevronDown size={14} className="shrink-0 text-text-muted" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-border-subtle px-4 py-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-3">
              {/* Levels */}
              <dl className="grid grid-cols-3 gap-2">
                <Level label="入场 Entry" value={s.entry} cls="text-accent" />
                <Level label="止损 SL" value={s.stopLoss} cls="text-bearish" />
                <Level label="止盈 TP" value={s.takeProfit} cls="text-bullish" />
              </dl>

              {/* Reasons */}
              <ul className="flex flex-col gap-1">
                {s.reasons.map((r) => (
                  <li key={r} className="flex gap-2 text-xs text-text-secondary">
                    <Check size={12} className="mt-0.5 shrink-0 text-bullish" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>

              {/* Evidence */}
              <div className="flex flex-wrap gap-2">
                {s.evidence.map((ev) => (
                  <span key={ev.source} className="rounded-sm border border-border bg-bg/50 px-2 py-0.5 text-[10px] text-text-muted">
                    {ev.source} · {ev.signal}
                  </span>
                ))}
              </div>
            </div>

            {/* Risk / Meta */}
            <div className="flex shrink-0 flex-col items-end gap-1 text-xs text-text-muted">
              <span>风险 · {s.riskLevel === "high" ? "高" : s.riskLevel === "medium" ? "中" : "低"}</span>
              <span className="font-mono">{s.timeframe}</span>
              <span className="font-mono">{s.model}</span>
              {s.closedAt && (
                <span>关闭 {new Date(s.closedAt).toLocaleDateString("zh-CN")}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Level({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="rounded-sm border border-border-subtle bg-bg/60 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className={cn("m-0 font-mono text-xs font-medium", cls)}>{value}</dd>
    </div>
  );
}
