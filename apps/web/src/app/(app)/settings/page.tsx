"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { SkeletonPanel, ErrorState } from "@/components/state/States";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useSettings, useUpdateSettings, useCreateApiKey, useDeleteApiKey } from "@/features/settings/api";
import { ProfileSection } from "@/features/settings/components/ProfileSection";
import { PasswordSection } from "@/features/settings/components/PasswordSection";
import { ColorSchemeSettings } from "@/features/settings/components/ColorSchemeSettings";
import { CurrencySettings } from "@/features/settings/components/CurrencySettings";
import { NotificationSettingsSection } from "@/features/settings/components/NotificationSettings";
import { ApiSettings } from "@/features/settings/components/ApiSettings";
import { Palette, DollarSign, Bell, Key, User, ShieldCheck, ChevronDown, ChevronUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const SECTIONS = [
  { key: "profile", label: "个人资料", icon: User },
  { key: "security", label: "密码与安全", icon: ShieldCheck },
  { key: "currency", label: "币种设置", icon: DollarSign },
  { key: "appearance", label: "配色风格", icon: Palette },
  { key: "notifications", label: "通知偏好", icon: Bell },
  { key: "api", label: "API 密钥", icon: Key },
] as const;

function SettingsContent() {
  const { data, isLoading, isError, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const createApiKey = useCreateApiKey();
  const deleteApiKey = useDeleteApiKey();

  const [expanded, setExpanded] = useState<string>("profile");
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);

  if (isLoading || !data) return <SkeletonView />;
  if (isError)
    return <ErrorState title="设置数据不可用" description="请稍后重试。" onRetry={() => refetch()} />;

  const toggle = (key: string) => setExpanded((v) => (v === key ? "" : key));

  return (
    <div className="mx-auto flex max-w-container flex-col gap-4">
      <Panel title="设置">
        <div className="flex flex-col gap-1">
          {SECTIONS.map((sec) => {
            const open = expanded === sec.key;
            const Icon = sec.icon;
            return (
              <div key={sec.key} className="border border-border-subtle bg-bg/40">
                <button
                  onClick={() => toggle(sec.key)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elevated/50"
                >
                  <Icon size={16} className="text-text-muted" />
                  <span className="flex-1 text-sm font-medium text-text">{sec.label}</span>
                  {open ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
                </button>
                {open && (
                  <div className="border-t border-border-subtle px-4 py-4">
                    {sec.key === "profile" && (
                      <ProfileSection
                        profile={data.profile}
                        saving={updateSettings.isPending}
                        onSaveName={(name) => updateSettings.mutate({ profile: { ...data.profile, name } })}
                      />
                    )}
                    {sec.key === "security" && <PasswordSection />}
                    {sec.key === "currency" && (
                      <CurrencySettings
                        currency={data.currency}
                        rates={data.exchangeRates}
                        onChange={(v) => updateSettings.mutate({ currency: v })}
                      />
                    )}
                    {sec.key === "appearance" && (
                      <ColorSchemeSettings
                        value={data.colorScheme}
                        onChange={(v) => updateSettings.mutate({ colorScheme: v })}
                      />
                    )}
                    {sec.key === "notifications" && (
                      <NotificationSettingsSection
                        value={data.notifications}
                        onChange={(v) => updateSettings.mutate({ notifications: v })}
                      />
                    )}
                    {sec.key === "api" && (
                      <ApiSettings
                        keys={data.apiKeys}
                        locked={data.apiKeysLocked ?? false}
                        creating={createApiKey.isPending}
                        deleting={deleteApiKey.isPending}
                        createdKey={createdApiKey}
                        onCreate={(name) =>
                          createApiKey.mutate(name, {
                            onSuccess: (res) => setCreatedApiKey(res.key),
                          })
                        }
                        onDelete={(id) => deleteApiKey.mutate(id)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border-subtle bg-bg/40 p-4">
        <div>
          <p className="text-sm text-text">套餐与付费授权</p>
          <p className="text-xs text-text-muted">查看当前套餐、配额与升级方案</p>
        </div>
        <Link
          href="/billing"
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-accent bg-accent px-4 text-sm font-medium text-[#04120c] transition-colors hover:brightness-95"
        >
          套餐与授权 <ArrowUpRight size={14} />
        </Link>
      </div>

      <p className="border-t border-border-subtle pt-4 text-xs text-text-muted">
        免责声明：AlphaX 提供的智能分析与信号仅供研究与决策辅助，不构成投资建议。市场有风险，交易需谨慎。
      </p>
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

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
