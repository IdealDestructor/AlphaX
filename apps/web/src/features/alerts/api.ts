"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMockAlerts } from "./mock";
import type { AlertsPageData, CreateAlertPayload, UpdateAlertPayload } from "./types";

function fetchAlerts(): Promise<AlertsPageData> {
  return new Promise((r) => setTimeout(() => r(fetchMockAlerts()), 400));
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    staleTime: 30_000,
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: CreateAlertPayload) => {
      await new Promise((r) => setTimeout(r, 300));
      const { fetchMockCreateAlert } = await import("./mock");
      return fetchMockCreateAlert();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateAlertPayload) => {
      await new Promise((r) => setTimeout(r, 300));
      const { fetchMockUpdateAlert } = await import("./mock");
      return fetchMockUpdateAlert(payload.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await new Promise((r) => setTimeout(r, 200));
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
