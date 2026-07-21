import { Badge } from "@/components/ui/Badge";
import { Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import type { AnalysisEntry } from "@/features/analysis/types";
import { cn } from "@/lib/cn";
import { useState } from "react";

const trendCfg = {
  bullish: { tone: "bull" as const, text: "↑ 看涨 Bullish" },
  bearish: { tone: "bear" as const, text: "↓ 看跌 Bearish" },
  neutral: { tone: "neutral" as const, text: "· 中性 Neutral" },
};
const actionCfg = {
  buy: { tone: "bull" as const, text: "买入 Buy" },
  sell: { tone: "bear" as const, text: "卖出 Sell" },
  wait: { tone: "wait" as const, text: "等待回踩 Wait" },
};
const riskCfg = {
  low: { tone: "neutral" as const, text: "风险 · 低" },
  medium: { tone: "risk" as const, text: "风险 · 中" },
  high: { tone: "risk" as const, text: "风险 · 高" },
};

interface Props {
  entry: AnalysisEntry;
  onRefresh?: () => void;
}

export function AnalysisOverview({ entry, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Header badges + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={trendCfg[entry.trend].tone}>{trendCfg[entry.trend].text}</Badge>
          <Badge tone={actionCfg[entry.action].tone}>{actionCfg[entry.action].text}</Badge>
          <Badge tone={riskCfg[entry.riskLevel].tone}>{riskCfg[entry.riskLevel].text}</Badge>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border px-3 text-xs text-text-secondary hover:bg-bg-elevated"
          >
            <RefreshCw size={13} />
            刷新分析
          </button>
        )}
      </div>

      {/* Confidence */}
      <div className="flex items-baseline gap-4">
        <div className="font-mono text-[56px] font-semibold leading-none tracking-tight text-transparent bg-[linear-gradient(180deg,var(--text)_20%,var(--bullish))] bg-clip-text">
          {entry.confidence}%
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider text-text-muted">置信度</span>
          <span className="font-mono text-xs text-text-muted">{entry.model} · {entry.timeframe}</span>
        </div>
      </div>
      <div className="h-2 max-w-[300px] overflow-hidden rounded-full bg-border-subtle">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--bullish),var(--accent))]"
          style={{ width: `${entry.confidence}%` }}
        />
      </div>

      {/* Levels */}
      <dl className="grid grid-cols-3 gap-3">
        <LevelItem label="入场 Entry" value={entry.levels.entry} cls="text-accent" />
        <LevelItem label="止损 SL" value={entry.levels.stopLoss} cls="text-bearish" />
        <LevelItem label="止盈 TP" value={entry.levels.takeProfit} cls="text-bullish" />
      </dl>

      {/* Reasons */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">核心理由</h3>
        <ul className="flex flex-col gap-1.5">
          {entry.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-text-secondary">
              <Check size={14} className="mt-0.5 shrink-0 text-bullish" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Evidence chain (collapsible list) — compact when not expanded */}
      <div className="border-t border-border-subtle pt-3">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          <span>证据链权重 · {entry.evidence.length} 项</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <div className={cn("mt-2 flex flex-col gap-2", !expanded && "hidden")}>
          {entry.evidence.map((ev) => (
            <div
              key={ev.source}
              className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 rounded-sm bg-bg/40 px-3 py-2"
            >
              <span className="col-span-2 text-sm font-medium text-text-secondary">{ev.source}</span>
              <span className="font-mono text-xs text-text-muted">{ev.signal}</span>
              <span className="text-right font-mono text-xs font-semibold text-accent">{(ev.weight * 100).toFixed(0)}%</span>
              <div className="col-span-2 mt-0.5 h-1 overflow-hidden rounded-full bg-border-subtle">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),color-mix(in_oklab,var(--accent),white_10%))]"
                  style={{ width: `${ev.weight * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border-subtle pt-3 font-mono text-xs text-text-muted">
        <span>Agent · {entry.sourceAgent}</span>
        <span>更新 {new Date(entry.updatedAt).toLocaleTimeString("zh-CN", { hour12: false })}</span>
      </div>
    </div>
  );
}

function LevelItem({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-bg/70 p-3">
      <dt className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className={cn("m-0 font-mono text-sm font-medium", cls)}>{value}</dd>
    </div>
  );
}
