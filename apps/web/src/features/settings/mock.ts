import type { SettingsPageData, ExchangeRate, ApiKey } from "./types";

const EXCHANGE_RATES: ExchangeRate[] = [
  { pair: "USD/CNY", rate: 7.25 },
  { pair: "EUR/USD", rate: 1.09 },
  { pair: "GBP/USD", rate: 1.27 },
  { pair: "JPY/USD", rate: 153.5 },
  { pair: "AUD/USD", rate: 0.66 },
  { pair: "USD/HKD", rate: 7.82 },
];

const API_KEYS: ApiKey[] = [
  {
    id: "k001",
    name: "默认密钥",
    key: "ax_k_8f3a2b1c9d0e4f5a6b7c8d9e0f1a2b3c",
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    lastUsedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export function fetchMockSettings(): SettingsPageData {
  return {
    currency: {
      baseCurrency: "USD",
      displayCurrency: "CNY",
    },
    exchangeRates: EXCHANGE_RATES,
    colorScheme: "international",
    notifications: {
      priceAlerts: { email: true, webPush: true, telegram: false },
      aiSignals: { email: true, webPush: false, telegram: false },
      newsAlerts: { email: false, webPush: true, telegram: false },
      systemUpdates: true,
    },
    apiKeys: API_KEYS,
    profile: {
      name: "Guest User",
      email: "guest@alphax.ai",
      plan: "pro",
    },
  };
}

export function fetchMockUpdateSettings(partial: Partial<SettingsPageData>): SettingsPageData {
  const current = fetchMockSettings();
  return { ...current, ...partial };
}
