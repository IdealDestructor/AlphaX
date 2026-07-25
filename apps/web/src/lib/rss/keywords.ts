export interface SymbolRule {
  symbol: string;
  keywords: string[];
  category: string;
}

export const SYMBOL_RULES: SymbolRule[] = [
  { symbol: "XAUUSD", keywords: ["gold", "xau", "xauusd", "precious metal", "bullion", "spot gold"], category: "贵金属" },
  { symbol: "XAGUSD", keywords: ["silver", "xag", "xagusd"], category: "贵金属" },
  { symbol: "BTCUSD", keywords: ["bitcoin", "btc", "cryptocurrency"], category: "数字货币" },
  { symbol: "DXY", keywords: ["dollar index", "dxy", "us dollar index"], category: "外汇" },
  { symbol: "NAS100", keywords: ["nasdaq", "ixic", "nasdaq 100", "nasdaq composite"], category: "股指" },
  { symbol: "SPX500", keywords: ["s&p 500", "sp500", "spx", "s&p500"], category: "股指" },
  { symbol: "WTI", keywords: ["crude oil", "wti", "oil price"], category: "大宗商品" },
  { symbol: "BRENT", keywords: ["brent", "brent crude"], category: "大宗商品" },
  { symbol: "GLD", keywords: ["gld", "spdr gold"], category: "ETF" },
  { symbol: "SLV", keywords: ["slv", "ishares silver"], category: "ETF" },
  { symbol: "SPY", keywords: ["spy", "spdr s&p"], category: "ETF" },
  { symbol: "US10Y", keywords: ["treasury", "bond yield", "us10y", "10-year yield"], category: "债券" },
  { symbol: "VIX", keywords: ["vix", "volatility index"], category: "市场情绪" },
];

export function matchSymbols(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const rule of SYMBOL_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      matched.push(rule.symbol);
    }
  }
  return matched;
}

export function detectCategory(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  const matched = SYMBOL_RULES.find((r) => r.keywords.some((kw) => text.includes(kw)));
  return matched?.category ?? "宏观经济";
}

const HIGH_IMPACT = [
  "fomc", "federal reserve", "interest rate", "cpi", "inflation",
  "nonfarm", "nfp", "gdp", "unemployment", "central bank",
  "cpi", "ppi", "jobs report", "payroll",
];

const MEDIUM_IMPACT = [
  "pmi", "manufacturing", "services", "retail sales",
  "trade", "tariff", "sanction", "durable goods",
];

export function detectImpact(text: string): "high" | "medium" | "low" {
  const lower = text.toLowerCase();
  if (HIGH_IMPACT.some((kw) => lower.includes(kw))) return "high";
  if (MEDIUM_IMPACT.some((kw) => lower.includes(kw))) return "medium";
  return "low";
}
