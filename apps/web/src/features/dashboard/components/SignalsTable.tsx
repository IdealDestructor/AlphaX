import { cn } from "@/lib/cn";
import type { SignalRow } from "@/features/dashboard/types";

const sideLabel = {
  buy: { text: "↑ 买入", cls: "text-bullish" },
  sell: { text: "↓ 卖出", cls: "text-bearish" },
  wait: { text: "· 观望", cls: "text-warning" },
};

const outcomeCls = {
  up: "text-bullish",
  down: "text-bearish",
  flat: "text-text-muted",
};

export function SignalsTable({ rows }: { rows: SignalRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-text-muted">
            <th className="sticky top-0 bg-bg-elevated/55 px-4 py-2.5 font-semibold">时间</th>
            <th className="sticky top-0 bg-bg-elevated/55 px-4 py-2.5 font-semibold">品种</th>
            <th className="sticky top-0 bg-bg-elevated/55 px-4 py-2.5 font-semibold">方向</th>
            <th className="sticky top-0 bg-bg-elevated/55 px-4 py-2.5 font-semibold">入场</th>
            <th className="sticky top-0 bg-bg-elevated/55 px-4 py-2.5 font-semibold">置信度</th>
            <th className="sticky top-0 bg-bg-elevated/55 px-4 py-2.5 font-semibold">结果</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated/80">
              <td className="px-4 py-2.5 font-mono text-text-secondary">{r.time}</td>
              <td className="px-4 py-2.5 font-medium text-text">{r.symbol}</td>
              <td className={cn("px-4 py-2.5 font-mono", sideLabel[r.side].cls)}>
                {sideLabel[r.side].text}
              </td>
              <td className="px-4 py-2.5 font-mono text-text-secondary">{r.entry}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-1.5 font-mono">
                  {r.confidence}%
                  <span className="h-[3px] w-12 overflow-hidden rounded-full bg-border">
                    <span className="block h-full bg-accent" style={{ width: `${r.confidence}%` }} />
                  </span>
                </span>
              </td>
              <td className={cn("px-4 py-2.5 font-mono", outcomeCls[r.outcomeDirection])}>
                {r.outcome}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
