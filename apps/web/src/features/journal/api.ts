"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockJournals, fetchMockJournalStats } from "./mock";
import type {
  CreateJournalPayload,
  JournalEntry,
  JournalPageData,
  JournalStats,
  UpdateJournalPayload,
} from "./types";

export function useJournals(params?: { symbol?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["journal", params?.symbol ?? "", params?.limit ?? 50, params?.offset ?? 0],
    queryFn: async (): Promise<JournalPageData> => {
      if (featureIsMock("journal")) return fetchMockJournals();
      return apiClient.get<JournalPageData>("/journal", {
        params: {
          symbol: params?.symbol,
          limit: params?.limit ?? 50,
          offset: params?.offset ?? 0,
        },
      });
    },
    staleTime: 30_000,
  });
}

export function useJournalStats() {
  return useQuery({
    queryKey: ["journal", "stats"],
    queryFn: async (): Promise<JournalStats> => {
      if (featureIsMock("journal")) return fetchMockJournalStats();
      return apiClient.get<JournalStats>("/journal/stats");
    },
    staleTime: 30_000,
  });
}

export function useCreateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateJournalPayload) => {
      if (featureIsMock("journal")) return payload as unknown as JournalEntry;
      return apiClient.post<JournalEntry>("/journal", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useUpdateJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateJournalPayload) => {
      if (featureIsMock("journal")) return payload as unknown as JournalEntry;
      const { id, ...body } = payload;
      return apiClient.patch<JournalEntry>(`/journal/${id}`, body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}

export function useDeleteJournal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (featureIsMock("journal")) return id;
      return apiClient.delete<{ id: string }>(`/journal/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
  });
}
