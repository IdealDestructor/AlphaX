"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMockSignals } from "./mock";
import type { SignalsPageData } from "./types";

function fetchSignals(): Promise<SignalsPageData> {
  return new Promise((r) => setTimeout(() => r(fetchMockSignals()), 600));
}

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: fetchSignals,
    staleTime: 15_000,
  });
}
