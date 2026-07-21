import type { PriceAlert, AlertsPageData } from "./types";

const SYMBOLS = ["XAUUSD", "XAGUSD", "BTCUSD", "DXY", "US10Y", "NAS100", "WTI"];
const CHANNELS = ["email", "web_push", "telegram"] as const;

function alert(
  id: string,
  overrides?: Partial<PriceAlert>,
): PriceAlert {
  const base: PriceAlert = {
    id,
    type: "price",
    symbol: "XAUUSD",
    condition: { op: "cross_above", price: 3400 },
    channels: ["email"],
    status: "active",
    note: "",
    lastTriggeredAt: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  };
  return { ...base, ...overrides };
}

const MOCK_ALERTS: PriceAlert[] = [
  alert("a001", {
    type: "price", symbol: "XAUUSD",
    condition: { op: "cross_above", price: 3450 },
    channels: ["email", "web_push"], status: "active",
    note: "突破历史新高预警",
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  }),
  alert("a002", {
    type: "price", symbol: "XAUUSD",
    condition: { op: "cross_below", price: 3300 },
    channels: ["email"], status: "active",
    note: "跌破关键支撑",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  }),
  alert("a003", {
    type: "price", symbol: "XAUUSD",
    condition: { op: "change_pct", changePct: 2 },
    channels: ["telegram"], status: "triggered",
    note: "单日涨幅超 2%",
    lastTriggeredAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  }),
  alert("a004", {
    type: "price", symbol: "XAGUSD",
    condition: { op: "cross_above", price: 32 },
    channels: ["email", "telegram"], status: "active",
    note: "白银突破 32 美元",
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }),
  alert("a005", {
    type: "price", symbol: "BTCUSD",
    condition: { op: "above", price: 100000 },
    channels: ["web_push"], status: "active",
    note: "BTC 站上 10 万",
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  }),
  alert("a006", {
    type: "price", symbol: "DXY",
    condition: { op: "cross_below", price: 100 },
    channels: ["email"], status: "paused",
    note: "美元指数跌破 100（暂禁用）",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }),
  alert("a007", {
    type: "news", symbol: "XAUUSD",
    condition: { op: "above", price: 0 },
    channels: ["email", "web_push"], status: "active",
    note: "重大新闻事件推送",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  }),
];

export function fetchMockAlerts(): AlertsPageData {
  return {
    alerts: MOCK_ALERTS,
    availableSymbols: SYMBOLS,
    availableChannels: [...CHANNELS],
  };
}

export function fetchMockCreateAlert(): PriceAlert {
  return alert("a-new", {
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export function fetchMockUpdateAlert(id: string): PriceAlert {
  const existing = MOCK_ALERTS.find((a) => a.id === id);
  if (!existing) throw new Error("Alert not found");
  return { ...existing, updatedAt: new Date().toISOString() };
}
