import { cn } from "@/lib/cn";
import type { Kpi } from "@/features/dashboard/types";

function deltaClass(v: number) {
  if (v > 0) return "text-bullish";
  if (v < 0) return "text-bearish";
  return "text-text-muted";
}

function riskLabel(r: Kpi["riskLevel"]) {
  return r === "high" ? "高" : r === "medium" ? "中" : "低";
}

export function KpiStrip({ kpi }: { kpi: Kpi }) {
  return (
    <section
      className="grid grid-cols-1 border border-border sm:grid-cols-2 lg:grid-cols-4"
      aria-label="关键指标"
    >
      <KpiCell label="XAUUSD 现价" value={kpi.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}>
        <p className={cn("font-mono text-sm", deltaClass(kpi.priceChangeAbs))}>
          ▲ +{kpi.priceChangeAbs} · +{kpi.priceChangePct}%
        </p>
        <p className="text-xs text-text-muted">较前收 2,374.70</p>
      </KpiCell>

      <KpiCell label="AI 置信度" value={`${kpi.confidence}%`}>
        <p className={cn("font-mono text-sm", deltaClass(kpi.confidenceDelta))}>
          ▲ +{kpi.confidenceDelta}pp 较上小时
        </p>
        <p className="text-xs text-text-muted">多因子融合 · 4H 主周期</p>
      </KpiCell>

      <KpiCell label="风险等级" value={<span className="text-warning">{riskLabel(kpi.riskLevel)}</span>}>
        <p className="font-mono text-sm text-text-muted">
          ATR(14) {kpi.atr} · 波动适中
        </p>
        <p className="text-xs text-text-muted">建议仓位 ≤ 账户 1.5%</p>
      </KpiCell>

      <KpiCell label="情绪指数" value={<span className="text-bullish">{kpi.sentiment}</span>}>
        <p className="font-mono text-sm text-bullish">偏多 · 机构净流入</p>
        <p className="text-xs text-text-muted">新闻 + COT + ETF 合成</p>
      </KpiCell>
    </section>
  );
}

function KpiCell({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="flex min-h-[104px] flex-col gap-1.5 border-border bg-bg-panel p-4 sm:[&:not(:first-child)]:border-l">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
      <div className="font-mono text-[28px] font-semibold leading-tight tracking-tight tabular">
        {value}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </article>
  );
}
