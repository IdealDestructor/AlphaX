import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, ChevronUp, Bell, Trash2, PauseCircle, PlayCircle } from "lucide-react";
import type { PriceAlert } from "@/features/alerts/types";

const opLabel: Record<string, string> = {
  cross_above: "上穿",
  cross_below: "下穿",
  above: "高于",
  below: "低于",
  change_pct: "涨跌幅超",
};

const channelLabel: Record<string, string> = {
  email: "邮件",
  web_push: "推送",
  telegram: "Telegram",
};

const statusLabel: Record<string, string> = {
  active: "启用",
  paused: "暂停",
  triggered: "已触发",
  expired: "已过期",
};

const statusTone: Record<string, "bull" | "bear" | "wait" | "neutral"> = {
  active: "bull",
  paused: "wait",
  triggered: "neutral",
  expired: "neutral",
};

interface Props {
  alerts: PriceAlert[];
  onToggleStatus: (id: string, current: string) => void;
  onDelete: (id: string) => void;
}

export function AlertList({ alerts, onToggleStatus, onDelete }: Props) {
  if (!alerts.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-text-muted">
        <Bell size={32} className="opacity-40" />
        <p className="text-sm">还没有设置价格告警</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((a) => (
        <AlertRow key={a.id} alert={a} onToggleStatus={onToggleStatus} onDelete={onDelete} />
      ))}
    </div>
  );
}

function AlertRow({ alert: a, onToggleStatus, onDelete }: { alert: PriceAlert; onToggleStatus: (id: string, current: string) => void; onDelete: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cond = a.condition;

  return (
    <div className="rounded-sm border border-border-subtle bg-bg/40 transition-colors hover:bg-bg-elevated/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
      >
        <span className="w-14 shrink-0 font-medium text-sm text-text">{a.symbol}</span>

        <span className="font-mono text-xs text-text-secondary">
          {cond.op === "change_pct"
            ? `${opLabel[cond.op]} ${cond.changePct}%`
            : `${opLabel[cond.op]} $${cond.price}`}
        </span>

        <div className="flex gap-1">
          {a.channels.map((ch) => (
            <span key={ch} className="rounded-sm border border-border bg-bg/50 px-1.5 py-0.5 text-[10px] text-text-muted">
              {channelLabel[ch]}
            </span>
          ))}
        </div>

        <Badge tone={statusTone[a.status] as "bull" | "bear" | "wait" | "neutral"} className="ml-auto">
          {statusLabel[a.status]}
        </Badge>

        {open ? <ChevronUp size={14} className="shrink-0 text-text-muted" /> : <ChevronDown size={14} className="shrink-0 text-text-muted" />}
      </button>

      {open && (
        <div className="border-t border-border-subtle px-4 py-4">
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Detail label="类型" value={a.type === "price" ? "价格" : a.type === "news" ? "新闻" : a.type === "ai" ? "AI" : "指标"} />
              <Detail label="条件" value={
                cond.op === "change_pct"
                  ? `涨跌幅 ${cond.changePct}%`
                  : `${opLabel[cond.op]} $${cond.price}`
              } />
              <Detail label="创建时间" value={new Date(a.createdAt).toLocaleDateString("zh-CN")} />
              <Detail label="最后触发" value={a.lastTriggeredAt ? new Date(a.lastTriggeredAt).toLocaleDateString("zh-CN") : "未触发"} />
            </dl>

            {a.note && (
              <p className="text-xs text-text-muted">备注：{a.note}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => onToggleStatus(a.id, a.status)}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-bg-panel px-3 text-xs font-medium text-text transition-colors hover:bg-bg-elevated"
              >
                {a.status === "active" ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                {a.status === "active" ? "暂停" : "启用"}
              </button>
              <button
                onClick={() => onDelete(a.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-transparent px-3 text-xs font-medium text-danger transition-colors hover:bg-bg-panel"
              >
                <Trash2 size={13} />
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="m-0 font-mono text-xs text-text-secondary">{value}</dd>
    </div>
  );
}
