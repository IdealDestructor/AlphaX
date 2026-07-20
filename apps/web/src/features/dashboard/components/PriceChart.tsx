"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const inds = [
  { key: "price", label: "价格" },
  { key: "ma", label: "MA" },
  { key: "band", label: "通道" },
] as const;

export function PriceChart({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const [active, setActive] = useState<(typeof inds)[number]["key"]>("price");

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="h-0.5 w-3.5 rounded-full bg-accent" /> 收盘
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-0.5 w-3.5 rounded-full bg-warning" /> EMA20
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="h-2 w-3 rounded-sm bg-[color:var(--accent)]/35" /> 波动带
        </span>
      </div>

      <div className="relative h-[280px] rounded-md border border-border-subtle bg-[radial-gradient(80%_70%_at_50%_0%,var(--accent)/8,transparent_70%),var(--bg)/55] p-1">
        <svg viewBox="0 0 640 280" preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`${symbol} 近 24 根 K 线收盘走势示意图`}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#3ecf8e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="priceStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7de3b5" />
              <stop offset="100%" stopColor="#3ecf8e" />
            </linearGradient>
          </defs>
          <g stroke="#1e2633" strokeWidth="1">
            <line x1="48" y1="24" x2="48" y2="240" />
            <line x1="48" y1="240" x2="620" y2="240" />
            <line x1="48" y1="80" x2="620" y2="80" strokeDasharray="2 4" opacity="0.55" />
            <line x1="48" y1="140" x2="620" y2="140" strokeDasharray="2 4" opacity="0.55" />
            <line x1="48" y1="200" x2="620" y2="200" strokeDasharray="2 4" opacity="0.55" />
          </g>
          <path
            d="M48,170 C120,155 180,130 240,145 C300,160 360,100 420,90 C480,80 540,95 620,70 L620,130 C540,150 480,140 420,145 C360,150 300,200 240,190 C180,180 120,200 48,210 Z"
            fill="url(#areaFill)"
            opacity={active === "band" ? 0.7 : 0.35}
          />
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points="48,190 90,185 130,175 170,168 210,172 250,160 290,150 330,142 370,128 410,118 450,110 490,105 530,98 570,92 620,85"
            opacity={active === "price" ? 0.35 : 0.95}
          />
          <polyline
            fill="none"
            stroke="url(#priceStroke)"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            points="48,200 90,188 130,170 170,178 210,165 250,148 290,155 330,130 370,118 410,125 450,100 490,95 530,88 570,78 620,62"
          />
          <circle cx="620" cy="62" r="3.5" fill="#3ecf8e" stroke="#07090c" strokeWidth="1.5" />
          <g strokeDasharray="4 3" strokeWidth="1">
            <line x1="48" y1="152" x2="620" y2="152" stroke="#3ecf8e" opacity="0.55" />
            <line x1="48" y1="210" x2="620" y2="210" stroke="#ef4444" opacity="0.55" />
            <line x1="48" y1="48" x2="620" y2="48" stroke="#22c55e" opacity="0.45" />
          </g>
        </svg>
      </div>

      <div className="mt-3 inline-flex border border-border bg-bg">
        {inds.map((b) => (
          <button
            key={b.key}
            onClick={() => setActive(b.key)}
            className={cn(
              "h-7 border-r border-border px-2.5 font-mono text-[11px] last:border-r-0",
              active === b.key
                ? "bg-bg-elevated font-semibold text-text"
                : "text-text-muted hover:text-text",
            )}
          >
            {b.label}
          </button>
        ))}
      </div>
      <span className="ml-3 font-mono text-xs text-text-muted">
        {symbol} · {timeframe}
      </span>
    </div>
  );
}
