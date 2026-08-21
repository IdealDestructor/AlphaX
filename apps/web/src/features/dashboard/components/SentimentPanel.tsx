import { cn } from "@/lib/cn";
import type { Sentiment } from "@/features/dashboard/types";

const SOURCE_LABEL: Record<string, string> = {
  cnn: "CNN Fear & Greed",
  mock: "模拟数据",
  cftc: "CFTC 真实",
};

export function SentimentPanel({ data }: { data: Sentiment }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-mono text-[34px] font-semibold leading-none tracking-tight text-bullish text-shadow-[0_0_28px_var(--bullish)/25]">
          {data.score}
          <span className="text-sm font-normal text-text-muted"> / 100</span>
        </div>
        <p className="mt-1 text-sm text-text-secondary">{data.label}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
          来源：{SOURCE_LABEL[data.sentimentSource] ?? data.sentimentSource}
        </p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs uppercase tracking-wider text-text-muted">
          <span>恐慌</span>
          <span>中性</span>
          <span>贪婪</span>
        </div>
        <div className="relative h-2.5 rounded-full bg-[linear-gradient(90deg,var(--bearish),var(--warning),var(--bullish))] opacity-90 shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
          <span
            className="absolute top-1/2 h-[18px] w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text shadow-[0_0_0_3px_var(--bg-panel),0_0_16px_var(--text)/35]"
            style={{ left: `${data.score}%` }}
          />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <Stat label="多头占比" value={data.longPct != null ? `${data.longPct}%` : "—"} tone="text-bullish" />
        <Stat label="空头占比" value={data.shortPct != null ? `${data.shortPct}%` : "—"} tone="text-bearish" />
        <Stat label="GLD ETF 净流入" value={data.etfInflow ?? "—"} tone="text-bullish" />
        <Stat label="COT 净多" value={data.cotChange ?? "—"} tone="text-bullish" />
      </dl>
      {data.cotSource && data.cotSource !== "mock" ? (
        <p className="font-mono text-[10px] uppercase tracking-wider text-bullish">
          COT 数据来自 {SOURCE_LABEL[data.cotSource] ?? data.cotSource}
        </p>
      ) : null}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-md border border-border-subtle bg-bg/70 p-3")}>
      <dt className="mb-1 text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className={`m-0 font-mono text-sm font-medium ${tone}`}>{value}</dd>
    </div>
  );
}
