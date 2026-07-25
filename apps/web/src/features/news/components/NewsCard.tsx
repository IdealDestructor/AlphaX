"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ChevronUp, ExternalLink, Clock, Target } from "lucide-react";
import type { AiNewsItem } from "../types";

function toneToBadge(tone: AiNewsItem["tone"]): "bull" | "bear" | "neutral" {
  if (tone === "bullish") return "bull";
  if (tone === "bearish") return "bear";
  return "neutral";
}

const impactStyles: Record<string, string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
  low: "border-border text-text-muted",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "刚刚";
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}

export function NewsCard({ item }: { item: AiNewsItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="flex flex-col border-b border-border-subtle last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="font-semibold text-text-secondary">{item.source}</span>
            <span>·</span>
            <span>{timeAgo(item.publishedAt)}</span>
            <span>·</span>
            <span className={cn("rounded border px-1 py-0.5 text-[10px]", impactStyles[item.impact])}>
              {item.impact === "high" ? "重要" : item.impact === "medium" ? "中等" : "一般"}
            </span>
          </div>
          <h3 className="mt-1 text-sm font-medium leading-snug text-text">{item.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-muted">{item.summary}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge tone={toneToBadge(item.tone)}>
              {item.tone === "bullish" ? "利多" : item.tone === "bearish" ? "利空" : "中性"}
            </Badge>
            <span className="text-[10px] text-text-muted">置信度 {Math.round(item.confidence * 100)}%</span>
            {item.expectedDuration && <span className="text-[10px] text-text-muted">· 预期影响 {item.expectedDuration}</span>}
          </div>
        </div>
        <div className="mt-1 shrink-0 text-text-muted">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-subtle bg-bg-elevated/30 px-4 py-3">
          <div className="mb-3 flex flex-wrap gap-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1">
              <Target size={12} />
              {item.category}
            </span>
            {item.symbols.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-accent">
                {s}
              </span>
            ))}
            {item.expectedDuration && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                影响期: {item.expectedDuration}
              </span>
            )}
            <span className="ml-auto text-[10px]">
              置信度
              <span className={cn("ml-1 font-semibold", item.confidence >= 0.7 ? "text-bullish" : item.confidence >= 0.5 ? "text-warning" : "text-text-muted")}>
                {Math.round(item.confidence * 100)}%
              </span>
            </span>
          </div>

          <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-elevated">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                item.confidence >= 0.7 ? "bg-bullish" : item.confidence >= 0.5 ? "bg-warning" : "bg-text-muted",
              )}
              style={{ width: `${item.confidence * 100}%` }}
            />
          </div>

          <p className="whitespace-pre-wrap text-xs leading-relaxed text-text-secondary">{item.content}</p>

          <div className="mt-3 flex items-center gap-2">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <ExternalLink size={12} />
              查看原文
            </a>
          </div>
        </div>
      )}
    </article>
  );
}
