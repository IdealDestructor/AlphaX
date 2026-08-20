"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useConfirmOrder, useGetOrder } from "@/features/billing/api";
import { ApiError } from "@/lib/api/errors";
import type { PlanId } from "@/features/billing/types";
import { CheckCircle2 } from "lucide-react";

const PLAN_LABEL: Record<PlanId, string> = { free: "免费版", pro: "Pro", enterprise: "Enterprise" };

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("session") ?? "";

  const getOrder = useGetOrder(false);
  const { mutate: fetchOrder, isPending: orderLoading, isError: orderError, data: orderData } = getOrder;
  const confirmOrder = useConfirmOrder();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchOrder(orderId, {
      onError: (err) => setError(err instanceof ApiError ? err.message : "订单不存在"),
    });
  }, [orderId, fetchOrder]);

  if (!orderId) {
    return (
      <Panel title="无效的支付会话">
        <p className="text-sm text-text-muted">缺少订单参数，请返回套餐页重新下单。</p>
        <div className="mt-4">
          <Button variant="primary" onClick={() => router.push("/billing")}>返回套餐页</Button>
        </div>
      </Panel>
    );
  }

  if (orderLoading) {
    return (
      <Panel title="订单加载中">
        <SkeletonPanel lines={4} />
      </Panel>
    );
  }

  if (orderError || !orderData) {
    return (
      <Panel title="订单不可用">
        <p className="text-sm text-danger">{error ?? "订单不存在或无权访问"}</p>
        <div className="mt-4">
          <Button variant="primary" onClick={() => router.push("/billing")}>返回套餐页</Button>
        </div>
      </Panel>
    );
  }

  const order = orderData;
  const paid = order.status === "paid";

  const onConfirm = async () => {
    setError(null);
    try {
      const res = await confirmOrder.mutateAsync(orderId);
      setDone(true);
      setTimeout(() => router.push("/billing?upgraded=1"), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "支付确认失败");
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 pt-12 text-center">
        <CheckCircle2 size={40} className="text-bullish" />
        <h1 className="text-lg font-semibold text-text">支付成功</h1>
        <p className="text-sm text-text-muted">正在跳转…</p>
      </div>
    );
  }

  return (
    <Panel title="订单确认" subtitle="本地模拟支付（生产环境走 Stripe）">
      <div className="flex flex-col gap-4">
        <div className="rounded-sm border border-border-subtle bg-bg/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">套餐</span>
            <span className="text-sm font-medium text-text">{PLAN_LABEL[order.plan as PlanId]}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-text-secondary">金额</span>
            <span className="font-mono text-lg font-semibold text-text">
              ${order.amount} <span className="text-xs text-text-muted">{order.currency}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-text-secondary">订单号</span>
            <span className="font-mono text-xs text-text-muted">{order.id.slice(0, 8)}…</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-text-secondary">状态</span>
            <Badge tone={paid ? "bull" : "wait"}>{paid ? "已支付" : "待支付"}</Badge>
          </div>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        {paid ? (
          <div className="flex items-center gap-2 text-sm text-bullish">
            <CheckCircle2 size={16} /> 该订单已支付
            <Link href="/billing" className="text-accent hover:underline">前往套餐页</Link>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={confirmOrder.isPending}>
              {confirmOrder.isPending ? "确认中…" : "确认支付（模拟）"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/billing")}>
              取消
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}

function SkeletonView() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <Panel title="加载中">
        <SkeletonPanel lines={6} />
      </Panel>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<SkeletonView />}>
        <div className="mx-auto flex max-w-container flex-col gap-4">
          <CheckoutContent />
        </div>
      </Suspense>
    </RequireAuth>
  );
}
