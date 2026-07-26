"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { getMockDashboard } from "./mock";
import type { DashboardData } from "./types";

async function fetchDashboard(symbol: string): Promise<DashboardData> {
  if (featureIsMock("dashboard")) return getMockDashboard(symbol);
  return apiClient.get<DashboardData>(`/dashboard/${symbol}`);
}

export function useDashboard(symbol: string) {
  return useQuery({
    queryKey: ["dashboard", symbol],
    queryFn: () => fetchDashboard(symbol),
    staleTime: 60_000,
  });
}
