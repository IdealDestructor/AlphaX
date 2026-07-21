"use client";

import { useState, useMemo } from "react";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { SkeletonPanel, ErrorState, EmptyState } from "@/components/state/States";
import { AlertList } from "@/features/alerts/components/AlertList";
import { AlertForm } from "@/features/alerts/components/AlertForm";
import { useAlerts, useCreateAlert, useUpdateAlert, useDeleteAlert } from "@/features/alerts/api";
import { Plus, Bell } from "lucide-react";
import type { AlertStatus } from "@/features/alerts/types";

const PAGE_TABS = [
  { key: "all", label: "全部", icon: Bell },
  { key: "active", label: "启用" },
  { key: "paused", label: "暂停" },
  { key: "triggered", label: "已触发" },
] as const;

export default function AlertsPage() {
  const { data, isLoading, isError, refetch } = useAlerts();
  const createAlert = useCreateAlert();
  const updateAlert = useUpdateAlert();
  const deleteAlert = useDeleteAlert();

  const [tab, setTab] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (tab === "all") return data.alerts;
    return data.alerts.filter((a) => a.status === tab);
  }, [data, tab]);

  if (isLoading || !data) return <SkeletonView />;
  if (isError)
    return <ErrorState title="告警数据不可用" description="请稍后重试。" onRetry={() => refetch()} />;

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="flex items-center justify-between">
        <Tabs tabs={PAGE_TABS} active={tab} onChange={setTab} />
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus size={14} />
          新建告警
        </Button>
      </div>

      <Panel
        title="价格告警"
        {...(filtered.length < data.alerts.length ? { subtitle: `已筛选 ${filtered.length}/${data.alerts.length}` } : {})}
      >
        <AlertList
          alerts={filtered}
          onToggleStatus={(id, current) => {
            const next: AlertStatus = current === "active" ? "paused" : "active";
            updateAlert.mutate({ id, status: next });
          }}
          onDelete={(id) => deleteAlert.mutate(id)}
        />
      </Panel>

      <AlertForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={(payload) => {
          createAlert.mutate(payload);
          setFormOpen(false);
        }}
      />

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="h-10 animate-pulse rounded bg-bg-panel" />
      <Panel title="加载中">
        <SkeletonPanel lines={6} />
      </Panel>
    </div>
  );
}
