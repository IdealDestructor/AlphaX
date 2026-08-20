"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { getMockDashboard } from "./mock";
import type { DashboardData, NewsItem } from "./types";
import type { NewsPageData } from "@/features/news/types";

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

/** Live news summary for the homepage: fetch real-time RSS via the Next.js route /api/news, filtered by the current symbol. */
async function fetchLiveNews(symbol: string): Promise<NewsItem[] | null> {
  try {
    const res = await fetch("/api/news", { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const data = (await res.json()) as NewsPageData;
    if (!Array.isArray(data.items) || data.items.length === 0) return null;

    const rows = data.items
      .filter((n) => n.symbols.includes(symbol))
      .slice(0, 5)
      .map((n) => ({
        time: new Date(n.publishedAt).toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        title: n.title,
        tag: n.impact === "high" ? "重要" : n.impact === "medium" ? "中等" : "一般",
        tagTone:
          n.tone === "bullish"
            ? ("pos" as const)
            : n.tone === "bearish"
              ? ("neg" as const)
              : ("neutral" as const),
        source: n.source,
      }));

    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

export function useLiveNews(symbol: string) {
  return useQuery({
    queryKey: ["live-news", symbol],
    queryFn: () => fetchLiveNews(symbol),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
