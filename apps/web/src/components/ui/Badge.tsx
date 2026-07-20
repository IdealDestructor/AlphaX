import { cn } from "@/lib/cn";

type BadgeTone = "bull" | "bear" | "wait" | "risk" | "neutral";

const toneStyles: Record<BadgeTone, string> = {
  bull: "text-bullish border-[color:var(--bullish)]/40 bg-[linear-gradient(180deg,var(--bullish)/16,var(--bullish)/6)]",
  bear: "text-bearish border-[color:var(--bearish)]/40 bg-[linear-gradient(180deg,var(--bearish)/16,var(--bearish)/6)]",
  wait: "text-warning border-[color:var(--warning)]/40 bg-[linear-gradient(180deg,var(--warning)/16,var(--warning)/6)]",
  risk: "text-warning border-[color:var(--warning)]/40",
  neutral: "text-text-muted",
};

export function Badge({
  tone,
  children,
  className,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
