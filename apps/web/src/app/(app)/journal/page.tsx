"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { JournalStatsPanel } from "@/features/journal/components/JournalStats";
import { JournalList } from "@/features/journal/components/JournalList";
import { JournalForm } from "@/features/journal/components/JournalForm";
import { useJournals, useJournalStats, useCreateJournal, useUpdateJournal, useDeleteJournal } from "@/features/journal/api";
import { useMarketSymbols } from "@/features/market/api";
import { ApiError } from "@/lib/api/errors";
import type { JournalEntry } from "@/features/journal/types";
import { Plus, NotebookPen } from "lucide-react";

function JournalContent() {
  const journals = useJournals();
  const stats = useJournalStats();
  const symbolsQuery = useMarketSymbols();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  const deleteJournal = useDeleteJournal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  const loading = journals.isLoading || stats.isLoading || symbolsQuery.isLoading;
  if (loading || !journals.data || !stats.data || !symbolsQuery.data) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <div className="h-16 animate-pulse rounded-lg bg-bg-panel" />
        <Panel title="交易日志">
          <SkeletonPanel lines={8} />
        </Panel>
      </div>
    );
  }

  // Pro 门控：后端 403 时展示升级引导
  const forbidden = [journals.error, stats.error, symbolsQuery.error]
    .some((e) => e instanceof ApiError && e.code === "FORBIDDEN");
  if (forbidden) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <UpgradePrompt
          required="Pro"
          description="交易日志（复盘 CRUD + 统计）为 Pro 专属功能，升级后即可使用。"
        />
      </div>
    );
  }

  if (journals.isError || stats.isError) {
    return (
      <ErrorState
        title="交易日志不可用"
        description="数据加载失败，请稍后重试。"
        onRetry={() => {
          void journals.refetch();
          void stats.refetch();
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-xl font-semibold tracking-tight">交易日志</h1>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={14} />
          记一笔
        </Button>
      </div>

      <JournalStatsPanel stats={stats.data} />

      <Panel title="交易复盘" subtitle={`${journals.data.total} 条记录`} tools={<NotebookPen size={14} className="text-text-muted" />}>
        <JournalList
          journals={journals.data.items}
          onEdit={(j) => {
            setEditing(j);
            setFormOpen(true);
          }}
          onDelete={(id) => deleteJournal.mutate(id)}
          deleting={deleteJournal.isPending}
        />
      </Panel>

      {(formOpen || editing) && (
        <Panel title={editing ? "编辑记录" : "记一笔"} className="border-t-2 border-t-accent">
          <JournalForm
            symbols={symbolsQuery.data}
            initial={editing}
            submitting={createJournal.isPending || updateJournal.isPending}
            onClose={() => {
              setFormOpen(false);
              setEditing(null);
            }}
            onSubmit={(payload) => {
              if (editing) {
                // 编辑时后端不接受 symbolId，去掉后提交
                const { symbolId: _symbolId, ...rest } = payload;
                updateJournal.mutate({ id: editing.id, ...rest });
              } else {
                createJournal.mutate(payload);
              }
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </Panel>
      )}

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的 AI 分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

export default function JournalPage() {
  return (
    <RequireAuth>
      <JournalContent />
    </RequireAuth>
  );
}


