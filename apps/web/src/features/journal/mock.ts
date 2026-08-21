import type { JournalEntry, JournalPageData, JournalStats } from "./types";

const SYMBOLS = ["XAUUSD", "XAGUSD", "BTCUSD", "DXY", "NAS100"];
const DAY = 86400000;

function entry(
  id: string,
  overrides: Partial<JournalEntry> = {},
): JournalEntry {
  const symbol = overrides.symbol ?? "XAUUSD";
  const side = overrides.side ?? "long";
  const entryPrice = overrides.entryPrice ?? 3300 + Math.random() * 200;
  const exitPrice = overrides.exitPrice ?? (side === "long" ? entryPrice * (1 + (Math.random() - 0.35) * 0.02) : entryPrice * (1 - (Math.random() - 0.35) * 0.02));
  const qty = overrides.qty ?? 10;
  const profit = overrides.profit ?? Math.round((side === "long" ? exitPrice - entryPrice : entryPrice - exitPrice) * qty * 100) / 100;
  const openedAt = overrides.openedAt ?? new Date(Date.now() - 3 * DAY).toISOString();
  return {
    id,
    symbol,
    side,
    entryPrice: Math.round(entryPrice * 100) / 100,
    exitPrice: Math.round(exitPrice * 100) / 100,
    qty,
    profit: Math.round(profit * 100) / 100,
    note: overrides.note ?? "趋势回踩做多，止损放在前低下方",
    tags: overrides.tags ?? ["4H", "趋势"],
    openedAt,
    closedAt: overrides.closedAt ?? new Date(Date.now() - 1 * DAY).toISOString(),
    createdAt: openedAt,
  };
}

const MOCK_ENTRIES: JournalEntry[] = [
  entry("j001", { symbol: "XAUUSD", side: "long", profit: 1250, tags: ["4H", "突破"] }),
  entry("j002", { symbol: "XAGUSD", side: "short", profit: -420, tags: ["1H", "逆势"] }),
  entry("j003", { symbol: "BTCUSD", side: "long", profit: 860, tags: ["日线", "ETF"] }),
  entry("j004", { symbol: "DXY", side: "short", profit: 340, tags: ["宏观"] }),
];

export function fetchMockJournals(): JournalPageData {
  return { items: MOCK_ENTRIES, total: MOCK_ENTRIES.length, page: 1, limit: 50, totalPages: 1 };
}

export function fetchMockJournalStats(): JournalStats {
  const profits = MOCK_ENTRIES.map((e) => e.profit ?? 0);
  const winning = profits.filter((p) => p > 0).length;
  const total = profits.length;
  const sum = profits.reduce((a, b) => a + b, 0);
  return {
    totalTrades: total,
    winningTrades: winning,
    losingTrades: total - winning,
    winRate: total > 0 ? Math.round((winning / total) * 10000) / 100 : 0,
    totalProfit: Math.round(sum * 100) / 100,
    averageProfit: total > 0 ? Math.round((sum / total) * 100) / 100 : 0,
  };
}
