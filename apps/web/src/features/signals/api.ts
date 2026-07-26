"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockSignals } from "./mock";
import type { SignalsPageData } from "./types";

async function fetchSignals(): Promise<SignalsPageData> {
  if (featureIsMock("signals")) return fetchMockSignals();
  return apiClient.get<SignalsPageData>("/signals");
}

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: fetchSignals,
    staleTime: 30_000,
  });
}
