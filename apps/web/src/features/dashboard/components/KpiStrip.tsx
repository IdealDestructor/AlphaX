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

export function KpiStrip({ kpi, symbol }: { kpi: Kpi; symbol?: string }) {
  return (
    <section
      className="grid grid-cols-1 border border-border sm:grid-cols-2 lg:grid-cols-4"
      aria-label="关键指标"
    >
      <KpiCell label={`${symbol ?? "XAUUSD"} 现价`} value={kpi.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}>
        <p className={cn("font-mono text-sm", deltaClass(kpi.priceChangeAbs))}>
          {kpi.priceChangeAbs >= 0 ? "▲" : "▼"} +{Math.abs(kpi.priceChangeAbs)} · +{kpi.priceChangePct}%
        </p>
        <p className="text-xs text-text-muted">较前收 {(kpi.price - kpi.priceChangeAbs).toFixed(2)}</p>
      </KpiCell>

      <KpiCell label="AI 置信度" value={`${kpi.confidence}%`}>
        <p className={cn("font-mono text-sm", deltaClass(kpi.confidenceDelta))}>
          {kpi.confidenceDelta >= 0 ? "▲" : "▼"} +{kpi.confidenceDelta}pp 较上小时
        </p>
        <p className="text-xs text-text-muted">多因子融合 · 4H 主周期</p>
      </KpiCell>

      <KpiCell label="风险等级" value={<span className="text-warning">{riskLabel(kpi.riskLevel)}</span>}>
        <p className="font-mono text-sm text-text-muted">
          ATR(14) {kpi.atr} · {kpi.atr > 15 ? "波动较高" : kpi.atr > 5 ? "波动适中" : "波动较低"}
        </p>
        <p className="text-xs text-text-muted">建议仓位 ≤ 账户 1.5%</p>
      </KpiCell>

      <KpiCell
        label="情绪指数"
        value={
          kpi.sentiment != null ? (
            <span className={kpi.sentiment >= 50 ? "text-bullish" : "text-bearish"}>{kpi.sentiment}</span>
          ) : (
            <span className="text-text-muted">—</span>
          )
        }
      >
        <p className={cn("font-mono text-sm", kpi.sentiment != null && (kpi.sentiment >= 50 ? "text-bullish" : "text-bearish"))}>
          {kpi.sentimentLabel}
        </p>
        <p className="text-xs text-text-muted">CNN Fear & Greed</p>
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

