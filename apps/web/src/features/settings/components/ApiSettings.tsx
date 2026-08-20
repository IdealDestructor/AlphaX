import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Eye, EyeOff, Plus, Trash2, Lock } from "lucide-react";
import type { ApiKey } from "@/features/settings/types";

interface Props {
  keys: ApiKey[];
  locked: boolean;
  creating: boolean;
  deleting: boolean;
  createdKey: string | null;
  onCreate: (name: string) => void;
  onDelete: (id: string) => void;
}

export function ApiSettings({ keys, locked, creating, deleting, createdKey, onCreate, onDelete }: Props) {
  const [name, setName] = useState("");

  if (locked) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-sm border border-warning/40 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <span className="flex items-center gap-1.5 font-medium"><Lock size={12} /> API 密钥为 Pro+ 功能</span>
          <p className="mt-1 text-text-muted">升级 Pro / Enterprise 后可创建 API 密钥。</p>
        </div>
        <a
          href="/billing"
          className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-sm border border-accent bg-accent px-4 text-sm font-medium text-[#04120c] transition-colors hover:brightness-95"
        >
          去升级
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {createdKey && (
        <div className="rounded-sm border border-bullish/40 bg-bullish/10 px-3 py-2.5">
          <p className="text-xs font-medium text-bullish">密钥创建成功（仅显示一次，请立即复制保存）</p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="min-w-0 flex-1 break-all rounded-sm border border-border bg-bg px-2 py-1 font-mono text-xs text-text">
              {createdKey}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(createdKey); }}
              className="rounded-sm p-1.5 text-text-muted hover:text-text"
              title="复制"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="text-xs text-text-muted">暂无 API 密钥</p>
      ) : (
        keys.map((k) => <ApiKeyRow key={k.id} apiKey={k} onDelete={onDelete} deleting={deleting === true} />)
      )}

      <form
        className="flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onCreate(name.trim());
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="密钥名称，如：交易机器人"
          className="h-9 flex-1 border border-border bg-bg px-3 text-sm text-text outline-none focus:border-accent"
        />
        <Button type="submit" variant="secondary" disabled={creating || !name.trim()}>
          <Plus size={14} />
          新建
        </Button>
      </form>
    </div>
  );
}

function ApiKeyRow({ apiKey: k, onDelete, deleting }: { apiKey: ApiKey; onDelete: (id: string) => void; deleting?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const masked = k.key.length > 12 ? k.key.slice(0, 8) + "••••••••" + k.key.slice(-4) : k.key;

  const copy = () => {
    navigator.clipboard.writeText(k.key);
  };

  return (
    <div className="rounded-sm border border-border-subtle bg-bg/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">{k.name}</p>
          <p className="mt-1 font-mono text-xs text-text-muted">
            {revealed ? k.key : masked}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => setRevealed((v) => !v)} className="rounded-sm p-1.5 text-text-muted hover:text-text" title={revealed ? "隐藏" : "显示"}>
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button onClick={copy} className="rounded-sm p-1.5 text-text-muted hover:text-text" title="复制">
            <Copy size={14} />
          </button>
          <button onClick={() => onDelete(k.id)} disabled={deleting} className="rounded-sm p-1.5 text-danger hover:text-danger" title="删除">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex gap-3 text-[10px] text-text-muted">
        <span>创建于 {new Date(k.createdAt).toLocaleDateString("zh-CN")}</span>
        {k.lastUsedAt && <span>最近使用 {new Date(k.lastUsedAt).toLocaleDateString("zh-CN")}</span>}
      </div>
    </div>
  );
}
