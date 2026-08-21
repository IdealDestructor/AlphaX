import type { WatchlistItem, WatchlistPageData } from "./types";

const MOCK_ITEMS: WatchlistItem[] = [
  { symbol: "XAUUSD", name: "黄金", assetClass: "metals", sortOrder: 0, addedAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { symbol: "XAGUSD", name: "白银", assetClass: "metals", sortOrder: 1, addedAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { symbol: "BTCUSD", name: "比特币", assetClass: "crypto", sortOrder: 2, addedAt: new Date(Date.now() - 86400000).toISOString() },
];

export function fetchMockWatchlist(): WatchlistPageData {
  return { items: MOCK_ITEMS };
}
