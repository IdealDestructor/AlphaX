"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMockNews } from "./mock";
import type { NewsPageData } from "./types";

async function fetchNews(): Promise<NewsPageData> {
  try {
    const res = await fetch("/api/news", { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return (await res.json()) as NewsPageData;
  } catch {
    return fetchMockNews();
  }
}

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 60_000,
    retry: 1,
    retryDelay: 2000,
  });
}
