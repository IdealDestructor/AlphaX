"use client";

import { Panel } from "@/components/ui/Panel";
import { SkeletonPanel } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { PositionCalculator } from "@/features/tools/components/PositionCalculator";
import { useMarketSymbols } from "@/features/market/api";
import { useAuth } from "@/lib/auth";

function ToolsContent() {
  const { user } = useAuth();
  const symbolsQuery = useMarketSymbols();

  if (symbolsQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <Panel title="工具">
          <SkeletonPanel lines={6} />
        </Panel>
      </div>
    );
  }

  // 体验层门控：后端 PlanGuard 才是最终边界
  if (user?.plan === "free") {
    return (
      <div className="mx-auto flex max-w-container flex-col gap-4">
        <UpgradePrompt
          required="Pro"
          description="仓位计算器等专业工具为 Pro 专属功能，升级后即可使用。"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <div>
        <h1 className="m-0 text-xl font-semibold tracking-tight">交易工具</h1>
        <p className="mt-0.5 text-sm text-text-muted">仓位计算 · 风险预算 · 盈亏比（更多工具 P1 上线）</p>
      </div>

      <Panel title="仓位计算器" subtitle="按固定风险比例计算建议仓位" className="border-t-2 border-t-accent">
        <PositionCalculator />
      </Panel>

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的 AI 分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <RequireAuth>
      <ToolsContent />
    </RequireAuth>
  );
}
