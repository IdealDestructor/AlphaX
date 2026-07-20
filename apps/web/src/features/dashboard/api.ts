"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardMock } from "./mock";
import type { DashboardData } from "./types";

async function fetchDashboard(symbol: string): Promise<DashboardData> {
  // 模拟网络延迟；后续替换为 REST/WS。
  await new Promise((r) => setTimeout(r, 900));
  return { ...dashboardMock, analysis: { ...dashboardMock.analysis, symbol } };
}

export function useDashboard(symbol: string) {
  return useQuery({
    queryKey: ["dashboard", symbol],
    queryFn: () => fetchDashboard(symbol),
  });
}
