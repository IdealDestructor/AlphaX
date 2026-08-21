"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSmartMoney } from "./mock";
import type { SmartMoneyPageData } from "./types";

export function useSmartMoney() {
  return useQuery({
    queryKey: ["smart-money"],
    queryFn: async (): Promise<SmartMoneyPageData> => {
      if (featureIsMock("smart-money")) return fetchMockSmartMoney();
      return apiClient.get<SmartMoneyPageData>("/smart-money");
    },
    staleTime: 120_000,
  });
}
