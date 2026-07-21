export type Bias = "bullish" | "bearish" | "neutral";

export interface ForecastWindow {
  label: string;
  days: number;
  direction: Bias;
  medianPrice: number;
  lowBound: number;
  highBound: number;
  probability: number;
  confidence: number;
}

export interface KeyLevel {
  price: number;
  label: string;
  type: "support" | "resistance" | "pivot";
  probability: number;
}

export interface ForecastData {
  symbol: string;
  currentPrice: number;
  updatedAt: string;
  windows: ForecastWindow[];
  keyLevels: KeyLevel[];
  overallDirection: Bias;
  overallConfidence: number;
}

export interface ForecastPageData {
  symbol: string;
  forecast: ForecastData;
  availableSymbols: string[];
  availableTimeframes: string[];
}
