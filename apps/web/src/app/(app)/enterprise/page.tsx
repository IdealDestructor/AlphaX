"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { ApiSettings } from "@/features/settings/components/ApiSettings";
import { useEnterpriseApiKeys, useCreateEnterpriseKey, useDeleteEnterpriseKey } from "@/features/enterprise/api";
import { useMyEntitlements } from "@/features/billing/api";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";
import type { ApiKey } from "@/features/settings/types";
import { Building2, ShieldCheck } from "lucide-react";

function EnterpriseContent() {
  const { user } = useAuth();
  const { data: entitlements, isLoading: entLoading } = useMyEntitlements();
  const keysQuery = useEnterpriseApiKeys();
  const createKey = useCreateEnterpriseKey();
  const deleteKey = useDeleteEnterpriseKey();
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const plan = user?.plan ?? entitlements?.plan ?? "free";

  if (entLoading || keysQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <Panel title="企业工作台">
          <SkeletonPanel lines={8} />
        </Panel>
      </div>
    );
  }

  if (keysQuery.isError && !(keysQuery.error instanceof ApiError && keysQuery.error.code === "FORBIDDEN")) {
    return (
      <ErrorState title="企业数据不可用" description="请稍后重试。" onRetry={() => keysQuery.refetch()} />
    );
  }

  if (plan === "free") {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <UpgradePrompt
          required="Pro"
          description="API 密钥与企业管理能力为 Pro/Enterprise 专属，升级后即可使用。"
        />
      </div>
    );
  }

  const apiKeys: ApiKey[] = (keysQuery.data ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    key: k.keyPrefix,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
  }));

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="m-0 text-xl font-semibold tracking-tight">企业工作台</h1>
          <p className="mt-0.5 text-sm text-text-muted">API 密钥 · 数据访问 · 团队能力</p>
        </div>
        <Badge tone={plan === "enterprise" ? "bull" : "wait"}>
          {plan === "enterprise" ? "Enterprise" : "Pro"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <Building2 size={16} className="text-accent" /> 企业能力
          </div>
          <ul className="flex flex-col gap-2 text-xs text-text-muted">
            <li>· REST API 密钥（明文仅展示一次）</li>
            <li>· 作用域：market / analysis / signals / forecast / news</li>
            <li>· 密钥落库 SHA-256 哈希，泄露可随时吊销</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-text">
            <ShieldCheck size={16} className="text-accent" /> 安全说明
          </div>
          <ul className="flex flex-col gap-2 text-xs text-text-muted">
            <li>· API 密钥通过 Authorization: Bearer 传递</li>
            <li>· 配额与套餐门控由后端强制校验</li>
            <li>· 请勿将密钥提交到公开仓库</li>
          </ul>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg-panel p-4">
          <div className="text-sm font-semibold text-text">当前套餐</div>
          <p className="text-xs text-text-muted">
            {plan === "enterprise"
              ? "已解锁全部企业能力（含 enterprise 作用域）。"
              : "Pro 可管理 API 密钥；升级 Enterprise 解锁更高级别作用域与专属支持。"}
          </p>
        </div>
      </div>

      <Panel title="API 密钥管理" subtitle="创建 / 吊销数据访问密钥">
        <ApiSettings
          keys={apiKeys}
          locked={false}
          creating={createKey.isPending}
          deleting={deleteKey.isPending}
          createdKey={createdKey}
          onCreate={(name) =>
            createKey.mutate(name, {
              onSuccess: (res) => setCreatedKey(res.key),
            })
          }
          onDelete={(id) => deleteKey.mutate(id)}
        />
      </Panel>

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

export default function EnterprisePage() {
  return (
    <RequireAuth>
      <EnterpriseContent />
    </RequireAuth>
  );
}
