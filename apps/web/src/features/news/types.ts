export type NewsImpact = "high" | "medium" | "low";
export type NewsTone = "bullish" | "bearish" | "neutral";

export interface AiNewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  symbols: string[];
  summary: string;
  impact: NewsImpact;
  tone: NewsTone;
  confidence: number;
  expectedDuration: string;
  content: string;
}

export interface NewsPageData {
  items: AiNewsItem[];
  categories: string[];
  sources: string[];
  availableSymbols: string[];
  updatedAt: string;
}
