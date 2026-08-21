export type SmartMoneyDirection = "accumulate" | "distribute" | "neutral";

export interface SmartMoneySnapshot {
  symbol: string;
  etf: {
    netFlow: number;
    cumulative: number;
  };
  cot: {
    specLong: number;
    specShort: number;
    netSpecLong: number;
  };
  centralBank: {
    purchasesTonnes: number;
    trend: "accumulating" | "neutral";
  };
  signal: {
    direction: SmartMoneyDirection;
    strength: number;
  };
  dayOffset: number;
  /** 各分量数据来源：cot 可为 cftc（真实）或 mock（估算） */
  sources: {
    cot: "cftc" | "mock";
    etf: "mock";
    centralBank: "mock";
  };
}

export interface SmartMoneyHistoryPoint {
  date: string;
  etf: number;
  cotNet: number;
  cb: number;
}

export interface SmartMoneyItem extends SmartMoneySnapshot {
  history: SmartMoneyHistoryPoint[];
}

export interface SmartMoneyPageData {
  /** CFTC 真实 COT 报告信息（不可用时 source=mock） */
  cot: { asOf: string | null; reportDate: string | null; source: "cftc" | "mock" };
  items: SmartMoneyItem[];
  generatedAt: string;
}
