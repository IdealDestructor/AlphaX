export type ColorScheme = "international" | "chinese";

export interface CurrencyConfig {
  baseCurrency: string;
  displayCurrency: string;
}

export interface ExchangeRate {
  pair: string;
  rate: number;
}

export interface NotificationPref {
  email: boolean;
  webPush: boolean;
  telegram: boolean;
}

export interface NotificationSettings {
  priceAlerts: NotificationPref;
  aiSignals: NotificationPref;
  newsAlerts: NotificationPref;
  systemUpdates: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ProfileSettings {
  name: string;
  email: string;
  plan: "free" | "pro" | "max";
}

export interface SettingsPageData {
  /** 当前套餐不含 API Key 权限时为 true（后端 403 FORBIDDEN 降级） */
  apiKeysLocked?: boolean;
  currency: CurrencyConfig;
  exchangeRates: ExchangeRate[];
  colorScheme: ColorScheme;
  notifications: NotificationSettings;
  apiKeys: ApiKey[];
  profile: ProfileSettings;
}
