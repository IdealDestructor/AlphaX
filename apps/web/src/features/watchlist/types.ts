export interface WatchlistItem {
  symbol: string;
  name: string;
  assetClass: string;
  sortOrder: number;
  addedAt: string;
}

export interface WatchlistPageData {
  items: WatchlistItem[];
}
