"use client";

import { Search, X } from "lucide-react";

interface Props {
  categories: string[];
  sources: string[];
  categoryFilter: string;
  sourceFilter: string;
  toneFilter: string;
  search: string;
  onCategoryChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onToneChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  onClear: () => void;
}

const toneOptions = [
  { value: "all", label: "全部" },
  { value: "bullish", label: "利多" },
  { value: "bearish", label: "利空" },
  { value: "neutral", label: "中性" },
];

export function NewsFilters({
  categories,
  sources,
  categoryFilter,
  sourceFilter,
  toneFilter,
  search,
  onCategoryChange,
  onSourceChange,
  onToneChange,
  onSearchChange,
  onClear,
}: Props) {
  const hasFilters = categoryFilter || sourceFilter || toneFilter !== "all" || search;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="搜索新闻标题..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-full rounded border border-border bg-bg pl-8 pr-2 text-xs text-text outline-none placeholder:text-text-muted focus:border-accent"
        />
      </div>

      <select
        value={toneFilter}
        onChange={(e) => onToneChange(e.target.value)}
        className="h-8 rounded border border-border bg-bg px-2 text-xs text-text outline-none focus:border-accent"
      >
        {toneOptions.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="h-8 rounded border border-border bg-bg px-2 text-xs text-text outline-none focus:border-accent"
      >
        <option value="">全部分类</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={sourceFilter}
        onChange={(e) => onSourceChange(e.target.value)}
        className="h-8 rounded border border-border bg-bg px-2 text-xs text-text outline-none focus:border-accent"
      >
        <option value="">全部来源</option>
        {sources.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex h-8 items-center gap-1 rounded border border-border px-2 text-xs text-text-muted hover:text-text"
        >
          <X size={14} />
          清除
        </button>
      )}
    </div>
  );
}
