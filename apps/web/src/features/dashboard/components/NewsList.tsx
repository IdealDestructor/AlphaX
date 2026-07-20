import { cn } from "@/lib/cn";
import type { NewsItem } from "@/features/dashboard/types";

const tagTone = {
  pos: "border-[color:var(--bullish)]/35 bg-[color:var(--bullish)]/8 text-bullish",
  neg: "border-[color:var(--bearish)]/35 bg-[color:var(--bearish)]/8 text-bearish",
  neutral: "border-border text-text-secondary",
};

export function NewsList({ items }: { items: NewsItem[] }) {
  return (
    <div className="flex flex-col">
      {items.map((n) => (
        <article
          key={n.time + n.title}
          className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-b border-border-subtle px-4 py-3 last:border-0 hover:border-l-2 hover:border-l-accent hover:bg-bg-elevated/85"
        >
          <time className="row-span-2 py-0.5 font-mono text-xs text-text-muted">{n.time}</time>
          <h3 className="m-0 text-sm font-medium leading-snug text-text">{n.title}</h3>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                tagTone[n.tagTone],
              )}
            >
              {n.tag}
            </span>
            <span>{n.source}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
