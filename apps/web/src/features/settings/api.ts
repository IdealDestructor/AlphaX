"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMockSettings } from "./mock";
import type { SettingsPageData } from "./types";

function fetchSettings(): Promise<SettingsPageData> {
  return new Promise((r) => setTimeout(() => r(fetchMockSettings()), 400));
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
      await new Promise((r) => setTimeout(r, 200));
      const { fetchMockUpdateSettings } = await import("./mock");
      return fetchMockUpdateSettings(partial);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
