import { Badge } from "@/components/ui/Badge";
import { Check } from "lucide-react";
import type { AiAnalysis } from "@/features/dashboard/types";
import { cn } from "@/lib/cn";

const trendBadge = {
  bullish: { tone: "bull" as const, text: "↑ 看涨 Bullish" },
  bearish: { tone: "bear" as const, text: "↓ 看跌 Bearish" },
  neutral: { tone: "neutral" as const, text: "· 中性 Neutral" },
};

const actionBadge = {
  buy: { tone: "bull" as const, text: "→ 买入 Buy" },
  sell: { tone: "bear" as const, text: "→ 卖出 Sell" },
  wait: { tone: "wait" as const, text: "→ 等待回踩 Wait" },
};

const riskBadge = {
  low: { tone: "risk" as const, text: "风险 · 低" },
  medium: { tone: "risk" as const, text: "风险 · 中" },
  high: { tone: "risk" as const, text: "风险 · 高" },
};

export function AiAnalysisCard({ data }: { data: AiAnalysis }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_212px]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={trendBadge[data.trend].tone}>{trendBadge[data.trend].text}</Badge>
          <Badge tone={actionBadge[data.action].tone}>{actionBadge[data.action].text}</Badge>
          <Badge tone={riskBadge[data.riskLevel].tone}>{riskBadge[data.riskLevel].text}</Badge>
        </div>

        <div>
          <div className="flex items-baseline gap-3">
            <div className="bg-[linear-gradient(180deg,var(--text),var(--bullish))] bg-clip-text font-mono text-[44px] font-semibold leading-none tracking-tight text-transparent">
              {data.confidence}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              置信度
            </div>
          </div>
          <div className="mt-2 h-[5px] max-w-[220px] overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--bullish),var(--accent))]"
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2">
          <LevelItem label="入场 Entry" value={data.levels.entry} tone="entry" />
          <LevelItem label="止损 SL" value={data.levels.stopLoss} tone="sl" />
          <LevelItem label="止盈 TP" value={data.levels.takeProfit} tone="tp" />
        </dl>

        <ul className="flex flex-col gap-1.5">
          {data.reasons.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-text-secondary">
              <Check size={14} className="mt-0.5 shrink-0 text-bullish" />
              <span>{r}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-3 font-mono text-xs text-text-muted">
          <span>模型 · {data.model}</span>
          <span>{data.updatedAt}</span>
        </div>
      </div>

      <aside className="flex flex-col gap-3 border-border-subtle bg-[linear-gradient(180deg,var(--accent)/5,transparent_40%)] p-4 lg:border-l">
        <h4 className="m-0 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          证据链权重
        </h4>
        {data.evidence.map((ev) => (
          <div
            key={ev.source}
            className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 rounded-sm bg-bg/40 p-2"
          >
            <span className="col-span-2 font-medium text-text-secondary">{ev.source}</span>
            <span className="font-mono text-xs text-text-muted">{ev.signal}</span>
            <span className="text-right font-mono text-xs font-semibold text-[var(--accent)]">
              {ev.weight.toFixed(2)}
            </span>
            <div className="col-span-2 mt-1 h-[3px] overflow-hidden rounded-full bg-border-subtle">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent)/70)]"
                style={{ width: `${ev.weight * 100}%` }}
              />
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

function LevelItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "entry" | "sl" | "tp";
}) {
  const color =
    tone === "entry"
      ? "text-accent"
      : tone === "sl"
        ? "text-bearish"
        : "text-bullish";
  return (
    <div className="rounded-md border border-border-subtle bg-bg/70 p-3">
      <dt className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className={cn("m-0 font-mono text-sm font-medium", color)}>{value}</dd>
    </div>
  );
}
