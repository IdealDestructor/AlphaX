export type AssetCategory =
  | "metals"
  | "crypto"
  | "forex"
  | "indices"
  | "commodities"
  | "etf";

export interface AssetInfo {
  symbol: string;
  name: string;
  category: AssetCategory;
  categoryLabel: string;
  icon: string;
}

export const CATEGORIES: { key: AssetCategory; label: string; icon: string }[] = [
  { key: "metals", label: "贵金属", icon: "🥇" },
  { key: "crypto", label: "加密货币", icon: "₿" },
  { key: "forex", label: "外汇", icon: "💱" },
  { key: "indices", label: "股指", icon: "📊" },
  { key: "commodities", label: "大宗商品", icon: "🛢" },
  { key: "etf", label: "ETF", icon: "📦" },
];

export const ASSETS: AssetInfo[] = [
  { symbol: "XAUUSD", name: "黄金", category: "metals", categoryLabel: "贵金属", icon: "🥇" },
  { symbol: "XAGUSD", name: "白银", category: "metals", categoryLabel: "贵金属", icon: "🥈" },
  { symbol: "BTCUSD", name: "比特币", category: "crypto", categoryLabel: "加密货币", icon: "₿" },
  { symbol: "DXY", name: "美元指数", category: "forex", categoryLabel: "外汇", icon: "💵" },
  { symbol: "NAS100", name: "纳斯达克 100", category: "indices", categoryLabel: "股指", icon: "📈" },
  { symbol: "SPX500", name: "标普 500", category: "indices", categoryLabel: "股指", icon: "📊" },
  { symbol: "WTI", name: "WTI 原油", category: "commodities", categoryLabel: "大宗商品", icon: "🛢" },
  { symbol: "BRENT", name: "布伦特原油", category: "commodities", categoryLabel: "大宗商品", icon: "🛢" },
  { symbol: "GLD", name: "SPDR Gold Trust", category: "etf", categoryLabel: "ETF", icon: "📦" },
  { symbol: "SLV", name: "iShares Silver Trust", category: "etf", categoryLabel: "ETF", icon: "📦" },
  { symbol: "SPY", name: "SPDR S&P 500", category: "etf", categoryLabel: "ETF", icon: "📦" },
];

export function getAssetInfo(symbol: string): AssetInfo {
  return ASSETS.find((a) => a.symbol === symbol) ?? {
    symbol,
    name: symbol,
    category: "metals" as AssetCategory,
    categoryLabel: "其他",
    icon: "📊",
  };
}
