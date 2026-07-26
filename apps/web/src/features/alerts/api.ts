"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockAlerts, fetchMockCreateAlert as mockCreate, fetchMockUpdateAlert as mockUpdate } from "./mock";
import type { AlertsPageData, PriceAlert, CreateAlertPayload, UpdateAlertPayload } from "./types";

async function fetchAlerts(): Promise<AlertsPageData> {
  if (featureIsMock("alerts")) return fetchMockAlerts();
  return apiClient.get<AlertsPageData>("/alerts");
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
    mutationFn: async (payload: CreateAlertPayload) => {
      if (featureIsMock("alerts")) return mockCreate();
      return apiClient.post<PriceAlert>("/alerts", payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useUpdateAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateAlertPayload) => {
      if (featureIsMock("alerts")) return mockUpdate(payload.id);
      const { id, ...body } = payload;
      return apiClient.patch<PriceAlert>(`/alerts/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (featureIsMock("alerts")) return id;
      return apiClient.delete<{ id: string }>(`/alerts/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
