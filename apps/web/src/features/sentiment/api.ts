"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSentiment } from "./mock";
import type { SentimentPageData } from "./types";

export function useSentiment() {
  return useQuery({
    queryKey: ["sentiment"],
    queryFn: async (): Promise<SentimentPageData> => {
      if (featureIsMock("sentiment")) return fetchMockSentiment();
      return apiClient.get<SentimentPageData>("/sentiment");
    },
    staleTime: 60_000,
    refetchInterval: 300_000,
  });
}
