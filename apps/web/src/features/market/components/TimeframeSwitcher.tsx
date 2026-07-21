"use client";

import { cn } from "@/lib/cn";
import type { Timeframe } from "@/features/market/types";

const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "1m", label: "1m" },
  { key: "5m", label: "5m" },
  { key: "15m", label: "15m" },
  { key: "1H", label: "1H" },
  { key: "4H", label: "4H" },
  { key: "1D", label: "Daily" },
  { key: "1W", label: "Weekly" },
  { key: "1M", label: "Monthly" },
];

interface Props {
  value: Timeframe;
  onChange: (tf: Timeframe) => void;
}

export function TimeframeSwitcher({ value, onChange }: Props) {
  return (
    <div className="inline-flex border border-border bg-bg">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.key}
          onClick={() => onChange(tf.key)}
          className={cn(
            "h-7 border-r border-border px-2.5 font-mono text-[11px] last:border-r-0 transition-colors",
            value === tf.key
              ? "bg-bg-elevated font-semibold text-text"
              : "text-text-muted hover:text-text hover:bg-bg-elevated/50",
          )}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
