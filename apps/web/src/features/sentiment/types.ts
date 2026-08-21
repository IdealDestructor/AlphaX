export type SentimentLabel = "bullish" | "bearish" | "neutral";

export interface SentimentItem {
  symbol: string;
  score: number; // -1 ~ 1
  label: SentimentLabel;
  intensity: number; // 0 ~ 1
  newsCount: number;
  components: {
    news: number;
    social: number;
  };
  updatedAt: string;
  /** 各分量来源：news 真实、social 估算 */
  sources: { news: "real"; social: "mock" };
}

export interface SentimentPageData {
  /** 市场级真实情绪（CNN Fear & Greed；不可用时 score=null） */
  market: {
    score: number | null;
    label: string;
    rating: string | null;
    source: "cnn" | "mock";
    updatedAt: string | null;
  };
  items: SentimentItem[];
  total: number;
  generatedAt: string;
}
