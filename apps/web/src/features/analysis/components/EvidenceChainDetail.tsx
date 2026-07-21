import type { AnalysisEntry } from "@/features/analysis/types";

interface Props {
  entry: AnalysisEntry;
}

const agentLabels: Record<string, string> = {
  "技术结构 · 4H": "Market Agent",
  "宏观 · DXY / US10Y": "Macro Agent",
  "资金 · GLD ETF": "Smart Money Agent",
  "情绪 · 新闻 NLP": "Sentiment Agent",
  "动量 · RSI/MACD": "Indicator Agent",
};

const agentColors: Record<string, string> = {
  "Market Agent": "from-blue-500/30 to-blue-500/5 border-blue-500/30",
  "Macro Agent": "from-purple-500/30 to-purple-500/5 border-purple-500/30",
  "Smart Money Agent": "from-emerald-500/30 to-emerald-500/5 border-emerald-500/30",
  "Sentiment Agent": "from-amber-500/30 to-amber-500/5 border-amber-500/30",
  "Indicator Agent": "from-cyan-500/30 to-cyan-500/5 border-cyan-500/30",
};

export function EvidenceChainDetail({ entry }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {entry.evidence.map((ev) => {
        const agent = agentLabels[ev.source] ?? ev.source;
        const colorCls = agentColors[agent] ?? "from-gray-500/30 to-gray-500/5 border-gray-500/30";
        return (
          <div
            key={ev.source}
            className={`rounded-md border bg-gradient-to-b ${colorCls} p-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text">{ev.source}</div>
                <div className="mt-0.5 font-mono text-xs text-text-muted">{agent}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-lg font-semibold text-accent">
                  {ev.weight.toFixed(2)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted">权重</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="rounded-sm border border-border bg-bg/50 px-2 py-0.5 font-mono text-xs text-text">
                {ev.signal}
              </span>
              <div className="flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-border-subtle">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),color-mix(in_oklab,var(--accent),white_10%))]"
                    style={{ width: `${ev.weight * 100}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-xs text-text-muted">{ev.weight * 100}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
