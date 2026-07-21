import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { X, Plus } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import type { AlertType, AlertOp, AlertChannel, CreateAlertPayload } from "@/features/alerts/types";
const CHANNELS: { key: AlertChannel; label: string }[] = [
  { key: "email", label: "邮件" },
  { key: "web_push", label: "推送" },
  { key: "telegram", label: "Telegram" },
];
const OPS: { key: AlertOp; label: string }[] = [
  { key: "cross_above", label: "上穿" },
  { key: "cross_below", label: "下穿" },
  { key: "above", label: "高于" },
  { key: "below", label: "低于" },
  { key: "change_pct", label: "涨跌幅超" },
];
const TYPES: { key: AlertType; label: string }[] = [
  { key: "price", label: "价格" },
  { key: "news", label: "新闻" },
  { key: "ai", label: "AI" },
  { key: "indicator", label: "指标" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAlertPayload) => void;
}

export function AlertForm({ open, onClose, onSubmit }: Props) {
  const [type, setType] = useState<AlertType>("price");
  const [symbol, setSymbol] = useState("XAUUSD");
  const [op, setOp] = useState<AlertOp>("cross_above");
  const [price, setPrice] = useState("3400");
  const [changePct, setChangePct] = useState("2");
  const [channels, setChannels] = useState<AlertChannel[]>(["email"]);
  const [note, setNote] = useState("");

  if (!open) return null;

  const toggleChannel = (ch: AlertChannel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const handleSubmit = () => {
    onSubmit({
      type,
      symbol,
      condition: op === "change_pct"
        ? { op, changePct: Number(changePct) }
        : { op, price: Number(price) },
      channels,
      note: note || undefined,
    });
  };

  const isValid = symbol && channels.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md border border-border bg-bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">新建告警</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={cn(
                  "h-8 flex-1 border text-xs font-medium transition-colors",
                  type === t.key
                    ? "border-accent bg-accent-muted/30 text-accent"
                    : "border-border text-text-muted hover:text-text",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">品种</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
            >
              {ASSETS.map((a) => (
                <option key={a.symbol} value={a.symbol}>{a.symbol} — {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">条件</label>
            <div className="flex gap-2">
              <select
                value={op}
                onChange={(e) => setOp(e.target.value as AlertOp)}
                className="h-9 border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
              >
                {OPS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <input
                type="number"
                value={op === "change_pct" ? changePct : price}
                onChange={(e) => {
                  if (op === "change_pct") setChangePct(e.target.value);
                  else setPrice(e.target.value);
                }}
                className="h-9 flex-1 border border-border bg-bg px-3 font-mono text-sm text-text outline-none focus:border-accent"
                placeholder={op === "change_pct" ? "百分比" : "价格"}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">通知渠道</label>
            <div className="flex gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => toggleChannel(ch.key)}
                  className={cn(
                    "h-8 flex-1 border text-xs font-medium transition-colors",
                    channels.includes(ch.key)
                      ? "border-accent bg-accent-muted/30 text-accent"
                      : "border-border text-text-muted hover:text-text",
                  )}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-text-muted">备注（可选）</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 w-full border border-border bg-bg px-3 text-sm text-text outline-none placeholder:text-text-muted focus:border-accent"
              placeholder="例如：突破历史新高预警"
            />
          </div>

          <Button variant="primary" disabled={!isValid} onClick={handleSubmit} className="mt-2">
            <Plus size={14} />
            创建告警
          </Button>
        </div>
      </div>
    </div>
  );
}
