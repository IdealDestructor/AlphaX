"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMockNews } from "./mock";
import type { NewsPageData } from "./types";

function fetchNews(): Promise<NewsPageData> {
  return new Promise((r) => setTimeout(() => r(fetchMockNews()), 600));
}

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: fetchNews,
    staleTime: 30_000,
  });
}
