import { cn } from "@/lib/cn";
import type { ForecastWindow } from "@/features/forecast/types";

interface Props {
  windows: ForecastWindow[];
  currentPrice: number;
}

const dirCls = {
  bullish: "text-bullish",
  bearish: "text-bearish",
  neutral: "text-text-muted",
};
const dirLabel = {
  bullish: "↑ 看涨",
  bearish: "↓ 看跌",
  neutral: "· 中性",
};

export function ForecastTable({ windows, currentPrice }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-text-muted">
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">周期</th>
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">方向</th>
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">中位价</th>
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">区间</th>
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">涨跌幅</th>
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">概率</th>
            <th className="bg-bg-elevated/55 px-4 py-2.5 font-semibold">置信度</th>
          </tr>
        </thead>
        <tbody>
          {windows.map((w) => {
            const changePct = ((w.medianPrice - currentPrice) / currentPrice * 100).toFixed(1);
            return (
              <tr key={w.label} className="border-b border-border-subtle last:border-0 hover:bg-bg-elevated/80">
                <td className="px-4 py-3 font-mono text-text">{w.label}</td>
                <td className={cn("px-4 py-3 font-mono font-semibold", dirCls[w.direction])}>{dirLabel[w.direction]}</td>
                <td className="px-4 py-3 font-mono tabular text-text">{w.medianPrice.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono tabular text-text-muted">
                  {w.lowBound.toFixed(1)} – {w.highBound.toFixed(1)}
                </td>
                <td className={cn("px-4 py-3 font-mono tabular", +changePct >= 0 ? "text-bullish" : "text-bearish")}>
                  {+changePct >= 0 ? "+" : ""}{changePct}%
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    {(w.probability * 100).toFixed(0)}%
                    <span className="h-[3px] w-12 overflow-hidden rounded-full bg-border">
                      <span className="block h-full bg-accent" style={{ width: `${w.probability * 100}%` }} />
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 font-mono tabular text-text-secondary">
                  {(w.confidence * 100).toFixed(0)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
