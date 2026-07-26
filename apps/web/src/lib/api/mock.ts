/**
 * Standardized mock/real API switch.
 *
 * Usage:
 *   const useMock = createMockSwitch("market");
 *   if (useMock) return fetchMockMarketData(...);
 *   return apiClient.get<...>("/market/...");
 *
 * Environment: NEXT_PUBLIC_MOCK
 *   "1"       → all features use mock
 *   "market"  → only market uses mock (comma-separated)
 *   "0" / ""  → no mock, all real
 */
export function featureIsMock(feature: string): boolean {
  if (typeof process === "undefined") return true;
  const val = process.env.NEXT_PUBLIC_MOCK;
  if (!val || val === "0") return false;
  if (val === "1") return true;
  return val.split(",").map((s) => s.trim()).includes(feature);
}
