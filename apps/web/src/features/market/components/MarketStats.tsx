import { cn } from "@/lib/cn";
import type { Quote } from "@/features/market/types";

interface Props {
  quote: Quote;
}

export function MarketStats({ quote }: Props) {
  const isUp = quote.change >= 0;
  const rangePct = ((quote.high24h - quote.low24h) / quote.low24h * 100).toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatItem label="开盘" value={quote.prevClose.toFixed(2)} />
      <StatItem label="最高" value={quote.high24h.toFixed(2)} tone="bullish" />
      <StatItem label="最低" value={quote.low24h.toFixed(2)} tone="bearish" />
      <StatItem label="前收" value={quote.prevClose.toFixed(2)} />
      <StatItem label="日振幅" value={`${rangePct}%`} />
      <StatItem label="成交量" value={formatVol(quote.volume)} />
      <StatItem label="Bid" value={quote.bid.toFixed(2)} />
      <StatItem label="Ask" value={quote.ask.toFixed(2)} />
    </div>
  );
}

function StatItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bullish" | "bearish" | "neutral";
}) {
  return (
    <div className="rounded-sm border border-border-subtle bg-bg/70 px-3 py-2.5">
      <dt className="mb-0.5 text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd
        className={cn(
          "m-0 font-mono text-sm font-medium tabular",
          tone === "bullish" ? "text-bullish" : tone === "bearish" ? "text-bearish" : "text-text",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function formatVol(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(v);
}
