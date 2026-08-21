"use client";

import Link from "next/link";
import { ArrowUpRight, Crown } from "lucide-react";

/**
 * 套餐门控提示：后端返回 403 FORBIDDEN 时展示升级引导。
 * 真正的权限边界在后端 PlanGuard；这里只是体验层。
 */
export function UpgradePrompt({
  required = "Pro",
  description,
}: {
  required?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-accent/30 bg-accent-muted/10 p-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
        <Crown size={18} />
      </div>
      <h3 className="m-0 text-base font-semibold text-text">需要 {required} 套餐</h3>
      <p className="m-0 max-w-[320px] text-sm text-text-muted">
        {description ?? `该功能为 ${required} 专属，升级后可解锁。`}
      </p>
      <Link
        href="/billing"
        className="inline-flex h-9 items-center gap-2 rounded-sm border border-accent bg-accent px-4 text-sm font-medium text-[#04120c] transition-colors hover:brightness-95"
      >
        升级到 {required} <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
