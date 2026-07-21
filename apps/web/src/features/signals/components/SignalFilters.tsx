import { Search, X } from "lucide-react";
import type { Action } from "@/features/signals/types";

interface Props {
  symbols: string[];
  symbolFilter: string;
  sideFilter: Action | "all";
  outcomeFilter: string;
  search: string;
  onSymbolChange: (v: string) => void;
  onSideChange: (v: Action | "all") => void;
  onOutcomeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onClear: () => void;
}

const SIDES: { key: Action | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "buy", label: "买入" },
  { key: "sell", label: "卖出" },
  { key: "wait", label: "观望" },
];

const OUTCOMES: { key: string; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "hit_tp", label: "止盈" },
  { key: "hit_sl", label: "止损" },
  { key: "pending", label: "进行中" },
  { key: "expired", label: "已过期" },
];

export function SignalFilters(props: Props) {
  const hasFilter = props.symbolFilter || props.sideFilter !== "all" || props.outcomeFilter !== "all" || props.search;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-sm border border-border bg-bg-panel px-3 h-9 min-w-[180px]">
        <Search size={14} className="text-text-muted" />
        <input
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          placeholder="搜索信号…"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
        />
      </div>

      <select
        className="h-9 rounded-sm border border-border bg-bg-panel px-2 text-sm text-text outline-none focus:border-accent"
        value={props.symbolFilter}
        onChange={(e) => props.onSymbolChange(e.target.value)}
      >
        <option value="">全部品种</option>
        {props.symbols.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <div className="inline-flex border border-border bg-bg">
        {SIDES.map((s) => (
          <button
            key={s.key}
            onClick={() => props.onSideChange(s.key)}
            className={`h-7 border-r border-border px-2.5 text-[11px] last:border-r-0 font-mono ${
              props.sideFilter === s.key
                ? "bg-bg-elevated font-semibold text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <select
        className="h-9 rounded-sm border border-border bg-bg-panel px-2 text-sm text-text outline-none focus:border-accent"
        value={props.outcomeFilter}
        onChange={(e) => props.onOutcomeChange(e.target.value)}
      >
        {OUTCOMES.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>

      {hasFilter && (
        <button
          onClick={props.onClear}
          className="inline-flex h-7 items-center gap-1 text-xs text-text-muted hover:text-text"
        >
          <X size={13} />
          清除筛选
        </button>
      )}
    </div>
  );
}
