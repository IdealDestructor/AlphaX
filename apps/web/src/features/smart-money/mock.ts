import type { SmartMoneyItem, SmartMoneyPageData, SmartMoneySnapshot } from "./types";

function snapshot(symbol: string, seed: number): SmartMoneySnapshot {
  const rand = () => {
    let s = (seed * 997) >>> 0;
    return () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967295;
    };
  };
  const r = rand();
  const base = 50 + r() * 200;
  const etfNet = Math.round(base * (r() - 0.45) * 10) / 10;
  const netSpecLong = Math.round(10000 * (r() - 0.35));
  return {
    symbol,
    etf: {
      netFlow: etfNet,
      cumulative: Math.round(base * (0.5 + r()) * 10) / 10,
    },
    cot: {
      specLong: Math.round(10000 + r() * 80000),
      specShort: Math.round(10000 + r() * 60000),
      netSpecLong,
    },
    centralBank: {
      purchasesTonnes: Math.round(5 + r() * 40),
      trend: r() > 0.55 ? "accumulating" : "neutral",
    },
    signal: {
      direction:
        etfNet > 20 && netSpecLong > 0 ? "accumulate" : etfNet < -20 && netSpecLong < 0 ? "distribute" : "neutral",
      strength: Math.min(1, Math.abs(etfNet) / 100),
    },
    dayOffset: 0,
    sources: {
      cot: "mock",
      etf: "mock",
      centralBank: "mock",
    },
  };
}

function history(symbol: string, seed: number) {
  const out: SmartMoneyItem["history"] = [];
  for (let i = 13; i >= 0; i--) {
    const snap = snapshot(symbol, seed + i);
    out.push({
      date: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
      etf: snap.etf.netFlow,
      cotNet: snap.cot.netSpecLong,
      cb: snap.centralBank.purchasesTonnes,
    });
  }
  return out;
}

const CODES = ["XAUUSD", "XAGUSD", "GLD", "SLV"];
const MOCK_ITEMS: SmartMoneyItem[] = CODES.map((code, i) => ({
  ...snapshot(code, i + 1),
  history: history(code, i + 1),
}));

export function fetchMockSmartMoney(): SmartMoneyPageData {
  return {
    items: MOCK_ITEMS,
    generatedAt: new Date().toISOString(),
    cot: { asOf: null, reportDate: null, source: "mock" },
  };
}

