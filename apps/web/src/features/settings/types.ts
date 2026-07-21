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
  currency: CurrencyConfig;
  exchangeRates: ExchangeRate[];
  colorScheme: ColorScheme;
  notifications: NotificationSettings;
  apiKeys: ApiKey[];
  profile: ProfileSettings;
}
