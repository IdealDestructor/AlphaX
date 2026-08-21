"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSettings, fetchMockUpdateSettings } from "./mock";
import { normalizeNotificationSettings, type DeepPartial } from "./normalize";
import type { SettingsPageData, ApiKey, ProfileSettings } from "./types";

interface BackendProfile {
  email: string;
  displayName?: string | null;
  plan: "free" | "pro" | "enterprise";
  locale?: string;
  timezone?: string;
}

interface BackendSettings {
  locale?: string;
  timezone?: string;
  currency?: string;
  colorScheme?: "international" | "chinese";
  notifications?: Record<string, unknown>;
}

interface BackendApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

async function fetchSettings(): Promise<SettingsPageData> {
  if (featureIsMock("settings")) return fetchMockSettings();

  const defaults = fetchMockSettings();
  const [profile, settings] = await Promise.all([
    apiClient.get<BackendProfile>("/user/profile"),
    apiClient.get<BackendSettings>("/user/settings").catch(() => ({}) as BackendSettings),
  ]);

  let apiKeys: ApiKey[] = [];
  let apiKeysLocked = false;
  try {
    const keys = await apiClient.get<BackendApiKey[]>("/enterprise/api-keys");
    apiKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: k.keyPrefix, // 仅前缀可见；明文只在创建时展示一次
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    }));
  } catch (err) {
    if (err instanceof ApiError && err.code === "FORBIDDEN") {
      apiKeysLocked = true;
    }
  }

  const plan = profile.plan === "enterprise" ? "max" : profile.plan;
  const profileData: ProfileSettings = {
    name: profile.displayName || profile.email.split("@")[0] || "User",
    email: profile.email,
    plan,
  };

  return {
    ...defaults,
    currency: {
      baseCurrency: settings.currency || defaults.currency.baseCurrency,
      displayCurrency: defaults.currency.displayCurrency,
    },
    colorScheme: settings.colorScheme || defaults.colorScheme,
    // 后端可能返回 null / {} / 部分字段（新用户 DB 默认值为 {}），必须与默认值合并，
    // 否则通知设置组件读取 value[section][channel] 时会对 undefined 取属性而崩溃。
    notifications: normalizeNotificationSettings(
      settings.notifications as DeepPartial<SettingsPageData["notifications"]> | null | undefined,
      defaults.notifications,
    ),
    apiKeys,
    apiKeysLocked,
    profile: profileData,
  };
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partial: Partial<SettingsPageData>) => {
      if (featureIsMock("settings")) return fetchMockUpdateSettings(partial);

      if (partial.profile?.name) {
        await apiClient.patch("/user/profile", { displayName: partial.profile.name });
      }
      const settingsPatch: Record<string, unknown> = {};
      if (partial.currency?.baseCurrency) settingsPatch.currency = partial.currency.baseCurrency;
      if (partial.colorScheme) settingsPatch.colorScheme = partial.colorScheme;
      if (partial.notifications) settingsPatch.notifications = partial.notifications;
      if (Object.keys(settingsPatch).length > 0) {
        await apiClient.patch("/user/settings", settingsPatch);
      }

      const current = qc.getQueryData<SettingsPageData>(["settings"]) ?? fetchMockSettings();
      return { ...current, ...partial };
    },
    onSuccess: (result) => qc.setQueryData(["settings"], result),
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (payload: { oldPassword: string; newPassword: string }) =>
      apiClient.post<{ ok: boolean }>("/user/password", payload),
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiClient.post<{ id: string; name: string; key: string; keyPrefix: string; scopes: string[] }>(
        "/enterprise/api-keys",
        { name },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/enterprise/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
