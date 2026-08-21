"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { calculateLocally, usePositionCalculator } from "@/features/tools/api";
import type { PositionCalculatorInput, PositionCalculatorResult } from "@/features/tools/types";
import { useMarketSymbols } from "@/features/market/api";
import { Calculator, AlertTriangle } from "lucide-react";

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function ResultRow({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" | "text" }) {
  const cls = tone === "bull" ? "text-bullish" : tone === "bear" ? "text-bearish" : "text-text";
  return (
    <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5 text-sm last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className={`font-mono font-semibold tabular ${cls}`}>{value}</span>
    </div>
  );
}

export function PositionCalculator() {
  const symbolsQuery = useMarketSymbols();
  const mutation = usePositionCalculator();

  const [balance, setBalance] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [symbol, setSymbol] = useState("XAUUSD");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const input: PositionCalculatorInput = {
    balance: num(balance) ?? 0,
    riskPercent: num(riskPercent) ?? 0,
    entry: num(entry) ?? 0,
    stopLoss: num(stopLoss) ?? 0,
  };
  const tp = num(takeProfit);
  if (tp != null) input.takeProfit = tp;
  if (symbol) input.symbol = symbol;

  const preview = calculateLocally(input);
  const result: PositionCalculatorResult | null = mutation.data ?? null;
  const shown = result ?? preview;

  const inputCls =
    "h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* 输入区 */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            账户余额
            <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            风险比例 %
            <input value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs text-text-muted">
          标的（可选，用于 tickSize）
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className={inputCls}>
            <option value="">不指定</option>
            {(symbolsQuery.data ?? []).map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            入场价
            <input value={entry} onChange={(e) => setEntry(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            止损价
            <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-text-muted">
            止盈价
            <input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} inputMode="decimal" className={inputCls} />
          </label>
        </div>
        <Button
          variant="primary"
          disabled={mutation.isPending || !input.balance || !input.entry || !input.stopLoss}
          onClick={() => mutation.mutate(input)}
        >
          <Calculator size={14} />
          {mutation.isPending ? "计算中…" : "计算仓位"}
        </Button>
        {mutation.isError && (
          <p className="flex items-center gap-1.5 text-xs text-danger">
            <AlertTriangle size={13} /> 计算失败，请检查输入（止损价不能等于入场价）。
          </p>
        )}
        <p className="text-xs text-text-muted">
          输入后左侧即时预览，点击「计算仓位」以后端为准（含标的 tickSize）。
        </p>
      </div>

      {/* 结果区 */}
      <div className="rounded-lg border border-border bg-bg-panel">
        <div className="border-b border-border px-4 py-2.5 text-sm font-semibold text-text">仓位结果</div>
        {shown.error ? (
          <p className="flex items-center gap-1.5 px-4 py-6 text-sm text-danger">
            <AlertTriangle size={14} /> {shown.error}
          </p>
        ) : (
          <div>
            <ResultRow label="风险金额" value={`${shown.riskAmount}`} />
            <ResultRow label="每单位风险" value={`${shown.riskPerUnit}`} />
            <ResultRow label="建议数量" value={`${shown.qty}`} />
            <ResultRow label="仓位市值" value={`${shown.positionValue}`} />
            <ResultRow
              label="盈亏比 (R:R)"
              value={shown.rr != null ? `${shown.rr}` : "—"}
              tone={shown.rr != null && shown.rr >= 1 ? "bull" : shown.rr != null ? "bear" : "text"}
            />
            <ResultRow label="tickSize" value={`${shown.tickSize}`} />
          </div>
        )}
        {shown.takeProfit && shown.entry && shown.stopLoss && shown.entry !== shown.stopLoss ? (
          <div className="border-t border-border-subtle px-4 py-3 text-xs text-text-muted">
            止损距离 {(Math.abs(shown.entry - shown.stopLoss)).toFixed(2)} · 止盈距离{" "}
            {(Math.abs((shown.takeProfit ?? shown.entry) - shown.entry)).toFixed(2)}
          </div>
        ) : null}
      </div>
    </div>
  );
}


