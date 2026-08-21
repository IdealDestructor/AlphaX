"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CreateJournalPayload, JournalEntry, JournalSide } from "@/features/journal/types";
import type { MarketSymbolInfo } from "@/features/market/api";

interface Props {
  symbols: MarketSymbolInfo[];
  initial?: JournalEntry | null;
  submitting?: boolean;
  onSubmit: (payload: CreateJournalPayload) => void;
  onClose: () => void;
}

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

export function JournalForm({ symbols, initial, submitting, onSubmit, onClose }: Props) {
  const [symbol, setSymbol] = useState(initial?.symbol ?? symbols[0]?.code ?? "XAUUSD");
  const [side, setSide] = useState<JournalSide>(initial?.side ?? "long");
  const [entryPrice, setEntryPrice] = useState(initial?.entryPrice?.toString() ?? "");
  const [exitPrice, setExitPrice] = useState(initial?.exitPrice?.toString() ?? "");
  const [qty, setQty] = useState(initial?.qty?.toString() ?? "");
  const [profit, setProfit] = useState(initial?.profit?.toString() ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  const selected = symbols.find((s) => s.code === symbol);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const payload: CreateJournalPayload = {
      symbolId: selected.id,
      side,
      entryPrice: num(entryPrice),
      exitPrice: num(exitPrice),
      qty: num(qty),
      profit: num(profit),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (note.trim()) payload.note = note.trim();
    onSubmit(payload);
  };

  const inputCls =
    "h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent";

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          标的
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputCls}>
            {symbols.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          方向
          <select value={side} onChange={(e) => setSide(e.target.value as JournalSide)} className={inputCls}>
            <option value="long">做多 Long</option>
            <option value="short">做空 Short</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          开仓价
          <input value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} placeholder="如 3350" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          平仓价
          <input value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="如 3380" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          数量
          <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="手/股" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          盈亏
          <input value={profit} onChange={(e) => setProfit(e.target.value)} placeholder="如 1250" className={inputCls} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-text-muted">
        标签（逗号分隔）
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="4H, 突破" className={inputCls} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-text-muted">
        复盘笔记
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="记录入场理由、执行情况与教训…"
          className="w-full border border-border bg-bg px-3 py-2 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent"
        />
      </label>
      <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          取消
        </Button>
        <Button type="submit" variant="primary" disabled={submitting || !selected}>
          {initial ? "保存修改" : "记一笔"}
        </Button>
      </div>
    </form>
  );
}

