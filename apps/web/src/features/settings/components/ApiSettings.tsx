import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Copy, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { ApiKey } from "@/features/settings/types";

interface Props {
  keys: ApiKey[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}

export function ApiSettings({ keys, onAdd, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {keys.length === 0 ? (
        <p className="text-xs text-text-muted">暂无 API 密钥</p>
      ) : (
        keys.map((k) => <ApiKeyRow key={k.id} apiKey={k} onDelete={onDelete} />)
      )}
      <Button variant="secondary" onClick={onAdd} className="self-start">
        <Plus size={14} />
        新建密钥
      </Button>
    </div>
  );
}

function ApiKeyRow({ apiKey: k, onDelete }: { apiKey: ApiKey; onDelete: (id: string) => void }) {
  const [revealed, setRevealed] = useState(false);
  const masked = k.key.slice(0, 8) + "••••••••" + k.key.slice(-4);

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
          <button onClick={() => onDelete(k.id)} className="rounded-sm p-1.5 text-danger hover:text-danger" title="删除">
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
