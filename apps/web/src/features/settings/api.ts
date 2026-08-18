"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSettings, fetchMockUpdateSettings } from "./mock";
import type { SettingsPageData } from "./types";

interface BackendProfile {
  email: string;
  displayName?: string | null;
  plan: "free" | "pro" | "enterprise";
}

async function fetchSettings(): Promise<SettingsPageData> {
  if (featureIsMock("settings")) return fetchMockSettings();

  const profile = await apiClient.get<BackendProfile>("/user/profile");
  const defaults = fetchMockSettings();
  return {
    ...defaults,
    profile: {
      ...defaults.profile,
      name: profile.displayName || profile.email.split("@")[0] || "User",
      email: profile.email,
      plan: profile.plan === "enterprise" ? "max" : profile.plan,
    },
  };
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 300_000,
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
      const current = qc.getQueryData<SettingsPageData>(["settings"]) ?? fetchMockSettings();
      return { ...current, ...partial };
    },
    onSuccess: (result) => qc.setQueryData(["settings"], result),
  });
}
