import type { SignalDetail, SignalStats, SignalsPageData } from "./types";

const SYMBOLS = ["XAUUSD", "XAGUSD", "BTCUSD", "DXY"];
const TIMEFRAMES = ["15m", "1H", "4H", "1D"];

function sig(
  id: string,
  symbol: string,
  tf: string,
  side: SignalDetail["side"],
  conf: number,
  outcome: SignalDetail["outcome"],
  hoursAgo: number,
  pnlR: number | null,
): SignalDetail {
  const ago = Date.now() - hoursAgo * 3600 * 1000;
  const entry = +(2340 + Math.random() * 60).toFixed(1);
  return {
    id,
    symbol,
    timeframe: tf,
    createdAt: new Date(ago).toISOString(),
    side,
    direction: side === "buy" ? "up" : side === "sell" ? "down" : "flat",
    entry: String(entry),
    stopLoss: String(+(entry - 8 - Math.random() * 8).toFixed(1)),
    takeProfit: String(+(entry + 12 + Math.random() * 16).toFixed(1)),
    confidence: conf,
    riskLevel: conf > 70 ? "medium" : "low",
    reasons: [
      `${tf} 趋势${side === "buy" ? "看涨" : "看跌"}结构确认`,
      side === "buy" ? "RSI 金叉" : "RSI 死叉",
      `${symbol === "XAUUSD" ? "美元指数" : "关联品种"}趋势配合`,
    ],
    evidence: [
      { source: `技术 · ${tf}`, signal: side === "buy" ? "HH/HL" : "LH/LL", weight: +(0.25 + Math.random() * 0.15).toFixed(2) },
      { source: "动量 · RSI/MACD", signal: conf > 60 ? "金叉确认" : "交叉中", weight: +(0.15 + Math.random() * 0.15).toFixed(2) },
    ],
    outcome,
    pnlR,
    pnlPct: pnlR != null ? +(pnlR * 0.5).toFixed(2) : null,
    closedAt: outcome !== "pending" ? new Date(ago + 3600 * 1000 * (2 + Math.random() * 20)).toISOString() : null,
    model: "fusion-v2.1",
  };
}

const ALL_SIGNALS: SignalDetail[] = [
  sig("s001", "XAUUSD", "4H", "buy", 82, "hit_tp", 30, 1.8),
  sig("s002", "XAUUSD", "1H", "buy", 74, "hit_tp", 26, 0.6),
  sig("s003", "XAUUSD", "4H", "sell", 68, "hit_sl", 22, -0.8),
  sig("s004", "XAUUSD", "1H", "buy", 76, "hit_tp", 18, 1.2),
  sig("s005", "XAUUSD", "15m", "wait", 55, "expired", 14, null),
  sig("s006", "XAUUSD", "1H", "buy", 71, "pending", 8, null),
  sig("s007", "XAUUSD", "4H", "buy", 78, "pending", 4, null),
  sig("s008", "XAUUSD", "1H", "sell", 63, "hit_tp", 32, 0.9),
  sig("s009", "XAGUSD", "4H", "buy", 72, "hit_tp", 28, 1.1),
  sig("s010", "XAGUSD", "1H", "buy", 69, "hit_sl", 20, -0.5),
  sig("s011", "XAGUSD", "4H", "sell", 65, "hit_tp", 16, 0.7),
  sig("s012", "BTCUSD", "4H", "buy", 81, "hit_tp", 34, 2.2),
  sig("s013", "BTCUSD", "1H", "buy", 73, "pending", 6, null),
  sig("s014", "BTCUSD", "4H", "sell", 60, "hit_sl", 12, -1.1),
  sig("s015", "DXY", "4H", "sell", 67, "hit_tp", 24, 0.5),
  sig("s016", "DXY", "1H", "sell", 58, "expired", 10, null),
];

const stats: SignalStats = {
  total: ALL_SIGNALS.length,
  win: ALL_SIGNALS.filter((s) => s.outcome === "hit_tp").length,
  loss: ALL_SIGNALS.filter((s) => s.outcome === "hit_sl").length,
  pending: ALL_SIGNALS.filter((s) => s.outcome === "pending").length,
  winRate: +(ALL_SIGNALS.filter((s) => s.outcome === "hit_tp").length / (ALL_SIGNALS.filter((s) => s.outcome === "hit_tp" || s.outcome === "hit_sl").length || 1)).toFixed(2),
  avgR: +(
    ALL_SIGNALS.filter((s) => s.pnlR != null).reduce((sum, s) => sum + (s.pnlR ?? 0), 0) /
    (ALL_SIGNALS.filter((s) => s.pnlR != null).length || 1)
  ).toFixed(2),
  profitFactor: 1.8,
  bySymbol: {
    XAUUSD: { total: 8, win: 5, winRate: 0.63, avgR: 0.9 },
    XAGUSD: { total: 3, win: 2, winRate: 0.67, avgR: 0.43 },
    BTCUSD: { total: 3, win: 2, winRate: 0.67, avgR: 1.05 },
    DXY: { total: 2, win: 1, winRate: 0.5, avgR: 0.25 },
  },
  byTimeframe: {
    "15m": { total: 1, win: 0, winRate: 0 },
    "1H": { total: 6, win: 4, winRate: 0.67 },
    "4H": { total: 9, win: 6, winRate: 0.67 },
  },
};

export function fetchMockSignals(): SignalsPageData {
  return {
    signals: ALL_SIGNALS,
    stats,
    availableSymbols: SYMBOLS,
    availableTimeframes: TIMEFRAMES,
  };
}
