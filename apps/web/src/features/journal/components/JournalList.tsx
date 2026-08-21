import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/state/States";
import type { JournalEntry } from "@/features/journal/types";
import { Trash2, Pencil } from "lucide-react";

interface Props {
  journals: JournalEntry[];
  onEdit: (entry: JournalEntry) => void;
  onDelete: (id: string) => void;
  deleting?: boolean;
}

export function JournalList({ journals, onEdit, onDelete, deleting }: Props) {
  if (journals.length === 0) {
    return (
      <EmptyState
        title="还没有交易记录"
        description="点击右上角「记一笔」开始沉淀你的交易复盘。"
      />
    );
  }

  return (
    <div className="flex flex-col">
      {journals.map((j) => {
        const pnl = j.profit;
        return (
          <div
            key={j.id}
            className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-border-subtle px-4 py-3 last:border-b-0 hover:bg-bg-elevated/40"
          >
            {/* Side + symbol */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <span
                className={cn(
                  "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase",
                  j.side === "long"
                    ? "border-bullish/40 text-bullish"
                    : "border-bearish/40 text-bearish",
                )}
              >
                {j.side === "long" ? "多" : "空"}
              </span>
              <span className="font-mono text-xs text-text">{j.symbol}</span>
            </div>

            {/* Body */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-text-muted">
                <span>入 {j.entryPrice ?? "—"}</span>
                <span>出 {j.exitPrice ?? "—"}</span>
                {j.qty != null && <span>量 {j.qty}</span>}
                <span className={cn("font-semibold", pnl == null ? "" : pnl >= 0 ? "text-bullish" : "text-bearish")}>
                  盈亏 {pnl == null ? "—" : `${pnl >= 0 ? "+" : ""}${pnl}`}
                </span>
              </div>
              {j.note ? <p className="mt-1 line-clamp-2 text-xs text-text-muted">{j.note}</p> : null}
              {j.tags.length > 0 ? (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {j.tags.map((t) => (
                    <span key={t} className="rounded-full border border-border bg-bg px-2 py-0.5 font-mono text-[10px] text-text-muted">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-1 font-mono text-[10px] text-text-muted">
                {j.openedAt ? new Date(j.openedAt).toLocaleString("zh-CN", { hour12: false }) : "—"}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(j)}
                className="grid h-7 w-7 place-items-center text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
                aria-label="编辑记录"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(j.id)}
                disabled={deleting}
                className="grid h-7 w-7 place-items-center text-text-muted transition-colors hover:bg-bg-elevated hover:text-danger"
                aria-label="删除记录"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
