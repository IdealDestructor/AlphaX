"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import type { EnterpriseApiKey, EnterpriseApiKeyCreated } from "./types";

export function useEnterpriseApiKeys() {
  return useQuery({
    queryKey: ["enterprise", "api-keys"],
    queryFn: async (): Promise<EnterpriseApiKey[]> => {
      if (featureIsMock("enterprise")) return [];
      return apiClient.get<EnterpriseApiKey[]>("/enterprise/api-keys");
    },
    staleTime: 30_000,
  });
}

export function useCreateEnterpriseKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<EnterpriseApiKeyCreated> => {
      if (featureIsMock("enterprise")) {
        return {
          id: "mock-key",
          name,
          keyPrefix: "ax_mock1234",
          scopes: ["market", "analysis"],
          lastUsedAt: null,
          createdAt: new Date().toISOString(),
          key: "ax_mock1234abcdef",
        };
      }
      return apiClient.post<EnterpriseApiKeyCreated>("/enterprise/api-keys", { name });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enterprise", "api-keys"] });
    },
  });
}

export function useDeleteEnterpriseKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (featureIsMock("enterprise")) return id;
      return apiClient.delete<{ ok: boolean }>(`/enterprise/api-keys/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enterprise", "api-keys"] });
    },
  });
}

