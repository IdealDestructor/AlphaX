"use client";

import { Panel } from "@/components/ui/Panel";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { useSmartMoney } from "@/features/smart-money/api";
import { SmartMoneyCard } from "@/features/smart-money/components/SmartMoneyCard";
import { SmartMoneyHistory } from "@/features/smart-money/components/SmartMoneyHistory";
import { ApiError } from "@/lib/api/errors";
import { Landmark } from "lucide-react";

function SmartMoneyContent() {
  const { data, isLoading, isError, error, refetch } = useSmartMoney();

  if (isLoading || !data) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <Panel title="聪明钱">
          <SkeletonPanel lines={8} />
        </Panel>
      </div>
    );
  }

  if (error instanceof ApiError && error.code === "FORBIDDEN") {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <UpgradePrompt
          required="Pro"
          description="聪明钱（ETF 资金流 / COT / 央行购金）为 Pro 专属功能，升级后即可查看。"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="聪明钱数据不可用"
        description="机构资金数据暂时不可用，请稍后重试。"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">聪明钱</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          ETF 资金流 · COT 持仓 · 央行购金（确定性快照，真实数据管线 P2/P3 接入）
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.items.map((item) => (
          <SmartMoneyCard key={item.symbol} item={item} />
        ))}
      </div>

      {data.items.map((item) => (
        <Panel key={item.symbol} title={`${item.symbol} 资金流历史`} tools={<Landmark size={14} className="text-text-muted" />}>
          <SmartMoneyHistory history={item.history} />
        </Panel>
      ))}

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的 AI 分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

export default function SmartMoneyPage() {
  return (
    <RequireAuth>
      <SmartMoneyContent />
    </RequireAuth>
  );
}

