"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  usePlans,
  useMyEntitlements,
  useCreateCheckout,
  useActivateLicense,
  usePortal,
} from "@/features/billing/api";
import type { PlanId } from "@/features/billing/types";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { Crown, KeyRound, ExternalLink } from "lucide-react";

const PLAN_LABEL: Record<PlanId, string> = { free: "免费版", pro: "Pro", enterprise: "Enterprise" };
const PLAN_TONE: Record<PlanId, "neutral" | "bull" | "wait"> = { free: "neutral", pro: "bull", enterprise: "wait" };

function BillingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, refreshProfile } = useAuth();

  const { data: plansData, isLoading: plansLoading } = usePlans();
  const { data: entitlements, isLoading: entLoading, isError, refetch } = useMyEntitlements(true);
  const createCheckout = useCreateCheckout();
  const activateLicense = useActivateLicense();
  const portal = usePortal();

  const [licenseKey, setLicenseKey] = useState("");
  const [licenseMsg, setLicenseMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  const upgraded = params.get("upgraded");
  const manage = params.get("manage");

  if (plansLoading || entLoading) return <SkeletonView />;
  if (isError || !plansData || !entitlements) {
    return <ErrorState title="套餐数据不可用" description="请稍后重试。" onRetry={() => refetch()} />;
  }

  const currentPlan: PlanId = entitlements.plan;

  const onUpgrade = async (plan: "pro" | "enterprise") => {
    setCheckoutErr(null);
    setUpgrading(plan);
    try {
      const res = await createCheckout.mutateAsync(plan);
      router.push(res.checkoutUrl);
    } catch (err) {
      setCheckoutErr(err instanceof ApiError ? err.message : "创建订单失败");
    } finally {
      setUpgrading(null);
    }
  };

  const onActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLicenseMsg(null);
    try {
      const res = await activateLicense.mutateAsync(licenseKey.trim());
      setLicenseMsg({
        ok: true,
        text: res.alreadyActivated
          ? `已激活过，当前套餐：${PLAN_LABEL[res.plan as PlanId]}`
          : `授权码激活成功，套餐已升级至 ${PLAN_LABEL[res.plan as PlanId]}`,
      });
      setLicenseKey("");
      refreshProfile();
    } catch (err) {
      setLicenseMsg({ ok: false, text: err instanceof ApiError ? err.message : "激活失败" });
    }
  };

  const onPortal = async () => {
    try {
      const res = await portal.mutateAsync();
      if (res.portalUrl.startsWith("http")) {
        window.location.href = res.portalUrl;
      } else {
        router.push(res.portalUrl);
      }
    } catch {
      router.push("/billing?manage=1");
    }
  };

  const quotaRows = [
    { label: "每日 Chat", key: "chatPerDay" as const, used: entitlements.used.chatToday },
    { label: "自选标的", key: "watchlist" as const, used: entitlements.used.watchlist },
    { label: "价格告警", key: "alerts" as const, used: entitlements.used.alerts },
  ];

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      {upgraded && (
        <div className="rounded-sm border border-bullish/40 bg-bullish/10 px-4 py-3 text-sm text-bullish">
          支付成功，套餐已生效 🎉
        </div>
      )}
      {manage && entitlements.subscription && (
        <div className="rounded-sm border border-border-subtle bg-bg/40 px-4 py-3 text-xs text-text-muted">
          当前订阅：{PLAN_LABEL[entitlements.plan]}（{entitlements.subscription.provider} · {entitlements.subscription.status}）
          {entitlements.subscription.currentPeriodEnd
            ? ` · 有效期至 ${new Date(entitlements.subscription.currentPeriodEnd).toLocaleDateString("zh-CN")}`
            : ""}
        </div>
      )}

      <Panel
        title="我的套餐与权益"
        subtitle={`${user?.email ?? ""} · 当前 ${PLAN_LABEL[currentPlan]}`}
        tools={<Badge tone={PLAN_TONE[currentPlan]}>{PLAN_LABEL[currentPlan]}</Badge>}
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {quotaRows.map((q) => {
            const quota = entitlements.quota[q.key] ?? 0;
            const pct = quota > 0 ? Math.min(100, Math.round((q.used / quota) * 100)) : 0;
            return (
              <div key={q.key} className="rounded-sm border border-border-subtle bg-bg/40 p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-text-muted">{q.label}</span>
                  <span className="font-mono text-xs text-text">
                    {q.used}<span className="text-text-muted">/{quota}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-bg-elevated">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        {checkoutErr && <p className="mt-3 text-xs text-danger">{checkoutErr}</p>}
      </Panel>

      <Panel title="选择套餐" subtitle="随时升级或降级">
        <div className="grid gap-4 md:grid-cols-3">
          {plansData.items.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = plan.id !== "free" && currentPlan === "free";
            return (
              <div
                key={plan.id}
                className={`flex flex-col gap-3 border p-4 ${isCurrent ? "border-accent bg-accent-muted/20" : "border-border bg-bg/40"}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-text">{plan.name}</h3>
                  {isCurrent && <Badge tone="bull">当前</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-2xl font-semibold text-text">
                    ${plan.priceMonthly}
                  </span>
                  <span className="text-xs text-text-muted">/月</span>
                </div>
                <ul className="flex flex-col gap-1.5 text-xs text-text-secondary">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 text-accent">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {isCurrent ? (
                    <Button variant="secondary" disabled className="w-full">
                      当前套餐
                    </Button>
                  ) : plan.id === "free" ? (
                    <Button variant="secondary" className="w-full" onClick={() => router.push("/settings")}>
                      设置
                    </Button>
                  ) : (
                    <Button
                      variant={isUpgrade ? "primary" : "secondary"}
                      className="w-full"
                      disabled={upgrading !== null}
                      onClick={() => onUpgrade(plan.id as "pro" | "enterprise")}
                    >
                      <Crown size={14} />
                      {upgrading === plan.id ? "创建订单中…" : `升级到 ${plan.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="授权码激活" subtitle="通过 License Key 开通 Pro / Enterprise">
        <form onSubmit={onActivateLicense} className="flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="例如 ALPHAX-PRO-DEMO-0001"
            className="h-9 flex-1 border border-border bg-bg px-3 font-mono text-sm text-text outline-none focus:border-accent"
          />
          <Button type="submit" variant="primary" disabled={activateLicense.isPending || licenseKey.trim().length < 8}>
            <KeyRound size={14} />
            激活
          </Button>
        </form>
        {licenseMsg && (
          <p className={`mt-2 text-xs ${licenseMsg.ok ? "text-bullish" : "text-danger"}`}>{licenseMsg.text}</p>
        )}
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border-subtle bg-bg/40 p-4">
        <div>
          <p className="text-sm text-text">管理订阅与发票</p>
          <p className="text-xs text-text-muted">Stripe Customer Portal（生产）或本地模拟管理页</p>
        </div>
        <Button variant="secondary" onClick={onPortal} disabled={portal.isPending}>
          <ExternalLink size={14} />
          管理订阅
        </Button>
      </div>
    </div>
  );
}

function SkeletonView() {
  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <Panel title="加载中">
        <SkeletonPanel lines={8} />
      </Panel>
    </div>
  );
}

export default function BillingPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<SkeletonView />}>
        <BillingContent />
      </Suspense>
    </RequireAuth>
  );
}
