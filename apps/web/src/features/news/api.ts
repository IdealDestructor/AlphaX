"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { featureIsMock } from "@/lib/api/mock";
import { fetchMockNews } from "./mock";
import type { AiNewsItem, NewsImpact, NewsPageData, NewsTone } from "./types";

/** Backend /news record (NestJS News entity). */
interface BackendNews {
  id: string;
  source: string;
  title: string;
  url?: string | null;
  summary?: string | null;
  bodyText?: string | null;
  impact?: string | null;
  impactConfidence?: number | null;
  expectedDuration?: string | null;
  symbols: string[];
  publishedAt: string;
}

interface BackendNewsPage {
  items: BackendNews[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
  ["央行政策", ["美联储", "央行", "FOMC", "降息", "利率", "加息", "fed", "cpi"]],
  ["经济数据", ["CPI", "非农", "GDP", "失业", "零售", "就业", "PMI", "通胀"]],
  ["地缘政治", ["地缘", "战争", "停火", "制裁", "中东", "冲突", "关税"]],
  ["资金流向", ["ETF", "持仓", "净流入", "COMEX", "资金", "COT", "CFTC"]],
  ["实物需求", ["增持", "进口", "储备", "购金", "需求", "产量"]],
  ["宏观经济", ["美债", "收益率", "美元", "DXY", "利差", "宏观"]],
  ["市场情绪", ["情绪", "调查", "Kitco", "贪婪", "看涨", "看跌"]],
];

function deriveCategory(title: string, source: string): string {
  const lower = title.toLowerCase();
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((k) => lower.includes(k) || title.includes(k))) return cat;
  }
  const known = ["Reuters", "Bloomberg", "FT", "Kitco", "CFTC", "World Gold Council", "Investing"];
  if (known.includes(source)) return "宏观市场";
  return "市场";
}

function deriveTone(title: string, impact: string | null | undefined): NewsTone {
  const lower = title.toLowerCase();
  if (impact === "high" && /(上涨|支撑|流入|增持|看涨|突破|上涨)/.test(title)) return "bullish";
  if (impact === "high" && /(下跌|承压|回落|下滑|看跌|超预期)/.test(title)) return "bearish";
  if (/(看涨|上涨|支撑|流入|增持|利好|bullish|surge|rally)/.test(lower)) return "bullish";
  if (/(看跌|下跌|承压|回落|抛售|利空|bearish|slump|drop)/.test(lower)) return "bearish";
  return "neutral";
}

function mapImpact(impact: string | null | undefined): NewsImpact {
  return impact === "high" || impact === "medium" || impact === "low" ? impact : "medium";
}

function mapNews(raw: BackendNews): AiNewsItem {
  const category = deriveCategory(raw.title, raw.source);
  return {
    id: raw.id,
    title: raw.title,
    source: raw.source,
    url: raw.url ?? "#",
    publishedAt: raw.publishedAt,
    category,
    symbols: raw.symbols ?? [],
    summary: raw.summary ?? raw.bodyText ?? raw.title,
    impact: mapImpact(raw.impact),
    tone: deriveTone(raw.title, raw.impact),
    confidence: raw.impactConfidence != null ? Math.round(raw.impactConfidence * 100) : 50,
    expectedDuration: raw.expectedDuration ?? "—",
    content: raw.bodyText ?? raw.summary ?? raw.title,
  };
}

/**
 * News data source priority:
 *  1. Live RSS (Next.js route /api/news, fetched fresh on every request)
 *  2. Backend /news (DB; fallback - may contain seeded/static rows)
 *  3. Mock (last resort)
 */
async function fetchNews(): Promise<NewsPageData> {
  if (featureIsMock("news")) return fetchMockNews();

  // 1) Live RSS
  try {
    const res = await fetch("/api/news", { signal: AbortSignal.timeout(20_000) });
    if (res.ok) {
      const data = (await res.json()) as NewsPageData;
      if (Array.isArray(data.items) && data.items.length > 0) return data;
    }
  } catch {
    /* RSS unavailable - fall back to backend DB */
  }

  // 2) Backend /news (DB)
  try {
    const page = await apiClient.get<BackendNewsPage>("/news", {
      params: { limit: 50, offset: 0 },
    });
    const items = (page.items ?? []).map(mapNews);
    return {
      items,
      categories: [...new Set(items.map((n) => n.category))],
      sources: [...new Set(items.map((n) => n.source))],
      availableSymbols: [...new Set(items.flatMap((n) => n.symbols))],
      updatedAt: new Date().toISOString(),
    };
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
