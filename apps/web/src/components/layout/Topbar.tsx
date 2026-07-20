"use client";

import { Button } from "@/components/ui/Button";
import { Menu, Search, MessageSquare } from "lucide-react";

export function Topbar({
  onMenu,
  statusLabel = "行情正常",
  statusTone = "ok",
  updatedAt,
}: {
  onMenu: () => void;
  statusLabel?: string;
  statusTone?: "ok" | "warn" | "err";
  updatedAt?: string | undefined;
}) {
  const dotColor =
    statusTone === "err"
      ? "bg-danger"
      : statusTone === "warn"
        ? "bg-warning"
        : "bg-bullish";

  return (
    <header className="sticky top-0 z-15 flex min-h-[52px] items-center justify-between gap-4 border-b border-border bg-bg px-5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          className="text-text-secondary hover:text-text md:hidden"
          onClick={onMenu}
          aria-label="打开导航"
        >
          <Menu size={18} />
        </button>
        <h1 className="whitespace-nowrap text-lg font-semibold tracking-tight">
          市场总览
        </h1>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--bullish)]/35 bg-[color:var(--bullish)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-bullish">
          <span className="h-1.5 w-1.5 rounded-full bg-bullish" />
          LIVE
        </span>
      </div>

      <div className="flex items-center gap-2">
        <form
          role="search"
          className="hidden items-center gap-2 border border-border bg-bg-panel px-3 h-9 min-w-[220px] sm:flex focus-within:border-accent"
        >
          <Search size={14} className="text-text-muted" />
          <input
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
            placeholder="搜索 XAUUSD、信号…"
          />
          <kbd className="font-mono text-[10px] text-text-muted border border-border bg-bg px-1">/</kbd>
        </form>

        <span className="hidden items-center gap-1.5 font-mono text-xs text-text-muted lg:inline-flex">
          <span className={`h-[7px] w-[7px] rounded-full ${dotColor}`} />
          {statusLabel}
        </span>

        {updatedAt ? (
          <span className="hidden font-mono text-xs text-text-muted xl:inline">
            {updatedAt}
          </span>
        ) : null}

        <Button variant="secondary">刷新</Button>
        <Button variant="primary">
          <MessageSquare size={14} />
          <span className="hidden sm:inline">问 AI</span>
        </Button>
      </div>
    </header>
  );
}
