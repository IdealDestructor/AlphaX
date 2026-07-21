import type { ForecastData } from "@/features/forecast/types";

interface Props {
  data: ForecastData;
}

const WIDTH = 640;
const HEIGHT = 320;
const PAD = { top: 28, bottom: 32, left: 64, right: 48 };
const CHART_W = WIDTH - PAD.left - PAD.right;
const CHART_H = HEIGHT - PAD.top - PAD.bottom;

function toX(i: number, total: number) {
  return PAD.left + (i / (total - 1)) * CHART_W;
}
function toY(price: number, minP: number, maxP: number) {
  const ratio = (price - minP) / (maxP - minP);
  return PAD.top + CHART_H * (1 - ratio);
}

export function ForecastChart({ data }: Props) {
  const { windows, currentPrice } = data;
  const allPrices = windows.flatMap((w) => [w.lowBound, w.highBound, w.medianPrice]);
  const levelPrices = data.keyLevels.map((k) => k.price);
  const minP = Math.min(...allPrices, ...levelPrices) - 4;
  const maxP = Math.max(...allPrices, ...levelPrices) + 4;
  const range = maxP - minP;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[640px]" role="img" aria-label="概率预测锥形图">
        {/* Grid */}
        <g stroke="#1e2633" strokeWidth="1">
          {[0, 0.25, 0.5, 0.75, 1].map((r) => {
            const y = PAD.top + CHART_H * (1 - r);
            return (
              <g key={r}>
                <line x1={PAD.left} y1={y} x2={WIDTH - PAD.right} y2={y} strokeDasharray="2 4" opacity="0.45" />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#6b7689" fontFamily="'Geist Mono', monospace" fontSize="10">
                  {(minP + r * range).toFixed(0)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Cone fill + outline for each window */}
        {windows.map((w, i) => {
          const x = toX(i, windows.length);
          const wNext = i < windows.length - 1 ? toX(i + 1, windows.length) : x;

          // The cone: low→high at each endpoint, connected
          const yLow = toY(w.lowBound, minP, maxP);
          const yHigh = toY(w.highBound, minP, maxP);
          const yMed = toY(w.medianPrice, minP, maxP);
          const nextLow = toY(windows[Math.min(i + 1, windows.length - 1)]!.lowBound, minP, maxP);
          const nextHigh = toY(windows[Math.min(i + 1, windows.length - 1)]!.highBound, minP, maxP);

          const fill = w.direction === "bullish" ? "rgba(34,197,94,0.12)" : w.direction === "bearish" ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.10)";
          const stroke = w.direction === "bullish" ? "#22c55e" : w.direction === "bearish" ? "#ef4444" : "#94a3b8";

          return (
            <g key={w.label}>
              {/* Cone polygon */}
              <polygon
                points={`${x},${yLow} ${wNext},${nextLow} ${wNext},${nextHigh} ${x},${yHigh}`}
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              {/* Median line */}
              <line x1={x} y1={yMed} x2={wNext} y2={toY(windows[Math.min(i + 1, windows.length - 1)]!.medianPrice, minP, maxP)} stroke={stroke} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.7" />
              {/* Window label */}
              <text x={x} y={HEIGHT - PAD.bottom + 16} textAnchor={i === windows.length - 1 ? "end" : "middle"} fill="#6b7689" fontFamily="'Geist Mono', monospace" fontSize="10">
                {w.label}
              </text>
              {/* Probability label above high */}
              <text x={x} y={yHigh - 6} textAnchor="middle" fill={stroke} fontFamily="'Geist Mono', monospace" fontSize="9" opacity="0.8">
                {(w.probability * 100).toFixed(0)}%
              </text>
              {/* End circle on median */}
              <circle cx={x} cy={yMed} r="3" fill={stroke} />
            </g>
          );
        })}

        {/* Current price line */}
        <line
          x1={PAD.left} y1={toY(currentPrice, minP, maxP)}
          x2={WIDTH - PAD.right} y2={toY(currentPrice, minP, maxP)}
          stroke="#3ecf8e" strokeWidth="1.5" strokeDasharray="6 3"
        />
        <rect
          x={WIDTH - PAD.right - 16} y={toY(currentPrice, minP, maxP) - 9}
          width={28} height={18} rx={3}
          fill="#3ecf8e"
        />
        <text x={WIDTH - PAD.right - 2} y={toY(currentPrice, minP, maxP) + 4} textAnchor="end" fill="#04120c" fontFamily="'Geist Mono', monospace" fontSize="9" fontWeight="600">
          {currentPrice.toFixed(1)}
        </text>
        <text x={PAD.left - 6} y={toY(currentPrice, minP, maxP) + 3} textAnchor="end" fill="#3ecf8e" fontFamily="'Geist Mono', monospace" fontSize="9">
          现价
        </text>

        {/* Key levels */}
        {data.keyLevels.map((kl) => {
          const y = toY(kl.price, minP, maxP);
          const clr = kl.type === "resistance" ? "#ef4444" : kl.type === "support" ? "#22c55e" : "#f59e0b";
          return (
            <g key={kl.label}>
              <line x1={PAD.left} y1={y} x2={WIDTH - PAD.right} y2={y} stroke={clr} strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
              <text x={WIDTH - PAD.right + 4} y={y + 3} fill={clr} fontFamily="'Geist Mono', monospace" fontSize="9" opacity="0.8">
                {kl.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
