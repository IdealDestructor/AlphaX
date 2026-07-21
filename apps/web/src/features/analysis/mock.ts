import type { AnalysisEntry, AnalysisPageData, AccuracySummary, Timeframe } from "./types";

const NOW = Math.floor(Date.now() / 1000);

function entry(
  id: string,
  tf: Timeframe,
  trend: AnalysisEntry["trend"],
  action: AnalysisEntry["action"],
  conf: number,
  agoHours: number,
  outcome?: AnalysisEntry["outcome"],
): AnalysisEntry {
  const ago = NOW - agoHours * 3600;
  const base: Omit<AnalysisEntry, "outcome"> = {
    id,
    symbol: "XAUUSD",
    timeframe: tf,
    trend,
    action,
    confidence: conf,
    riskLevel: conf > 70 ? "medium" : conf > 50 ? "medium" : "high",
    levels: {
      entry: `${(2350 + Math.random() * 40).toFixed(1)}`,
      stopLoss: `${(2330 + Math.random() * 30).toFixed(1)}`,
      takeProfit: `${(2390 + Math.random() * 50).toFixed(1)}`,
    },
    reasons: [
      `${tf} 结构偏${trend === "bullish" ? "多" : "空"}`,
      `RSI ${conf > 60 ? "金叉" : "死叉"}确认`,
      "DXY 趋势配合",
    ],
    evidence: [
      { source: `技术 · ${tf}`, signal: trend === "bullish" ? "HH/HL" : "LH/LL", weight: +(0.25 + Math.random() * 0.15).toFixed(2) },
      { source: "宏观 · DXY", signal: trend === "bullish" ? "美元弱" : "美元强", weight: +(0.15 + Math.random() * 0.15).toFixed(2) },
      { source: "动量 · RSI/MACD", signal: conf > 60 ? "金叉" : "死叉", weight: +(0.1 + Math.random() * 0.1).toFixed(2) },
    ],
    model: "fusion-v2.1",
    sourceAgent: "coordinator",
    createdAt: new Date((ago - 600) * 1000).toISOString(),
    updatedAt: new Date(ago * 1000).toISOString(),
  };
  return outcome ? { ...base, outcome } : base;
}

const historyEntries: AnalysisEntry[] = [
  entry("a001", "4H", "bullish", "buy", 82, 26, { result: "hit_tp", pnlR: 1.8, pnlPct: 0.9 }),
  entry("a002", "1H", "bullish", "wait", 74, 20, { result: "hit_tp", pnlR: 0.6, pnlPct: 0.3 }),
  entry("a003", "4H", "bearish", "sell", 68, 14, { result: "hit_sl", pnlR: -0.8, pnlPct: -0.4 }),
  entry("a004", "1H", "bullish", "buy", 76, 8, { result: "hit_tp", pnlR: 1.2, pnlPct: 0.6 }),
  entry("a005", "15m", "neutral", "wait", 55, 4, { result: "expired" }),
  entry("a006", "1H", "bullish", "buy", 71, 2, { result: "pending" }),
];

const currentEntry: AnalysisEntry = {
  ...entry("a007", "4H", "bullish", "wait", 78, 0),
  reasons: [
    "4H 站稳 EMA20/50，结构仍为更高低点",
    "DXY 回落 + 美债收益率企稳，美元压力缓解",
    "GLD ETF 连续 3 日净流入，Smart Money 偏多",
    "短线 RSI 超买，优先等回踩再入场，而非追高",
  ],
  evidence: [
    { source: "技术结构 · 4H", signal: "HH/HL", weight: 0.32 },
    { source: "宏观 · DXY / US10Y", signal: "美元弱", weight: 0.24 },
    { source: "资金 · GLD ETF", signal: "净流入", weight: 0.22 },
    { source: "情绪 · 新闻 NLP", signal: "偏多", weight: 0.14 },
    { source: "动量 · RSI/MACD", signal: "过热", weight: 0.08 },
  ],
};

const accuracy: AccuracySummary = {
  total: 47,
  win: 31,
  loss: 16,
  winRate: 0.66,
  avgR: 0.92,
  byTimeframe: {
    "15m": { total: 12, win: 7, winRate: 0.58 },
    "1H": { total: 18, win: 12, winRate: 0.67 },
    "4H": { total: 14, win: 10, winRate: 0.71 },
    "1D": { total: 3, win: 2, winRate: 0.67 },
  },
};

export function fetchMockAnalysis(symbol: string): AnalysisPageData {
  return {
    symbol,
    current: { ...currentEntry, symbol },
    history: historyEntries,
    accuracy,
    availableTimeframes: ["15m", "1H", "4H", "1D"],
    updatedAt: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
  };
}
