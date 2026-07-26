"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSettings, fetchMockUpdateSettings } from "./mock";
import type { SettingsPageData } from "./types";

async function fetchSettings(): Promise<SettingsPageData> {
  if (featureIsMock("settings")) return fetchMockSettings();
  return apiClient.get<SettingsPageData>("/me");
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
      return apiClient.patch<SettingsPageData>("/me", partial);
    },
    onSuccess: (result) => qc.setQueryData(["settings"], result),
  });
}
