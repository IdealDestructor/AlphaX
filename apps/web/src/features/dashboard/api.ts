"use client";

import { useQuery } from "@tanstack/react-query";
import { getMockDashboard } from "./mock";
import type { DashboardData } from "./types";

async function fetchDashboard(symbol: string): Promise<DashboardData> {
  await new Promise((r) => setTimeout(r, 600));
  return getMockDashboard(symbol);
}

export function useDashboard(symbol: string) {
  return useQuery({
    queryKey: ["dashboard", symbol],
    queryFn: () => fetchDashboard(symbol),
  });
}
