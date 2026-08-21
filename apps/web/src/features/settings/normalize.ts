import type { NotificationPref, NotificationSettings } from "./types";

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

const EMPTY_PREF: NotificationPref = {
  email: false,
  webPush: false,
  telegram: false,
};

/**
 * 将后端可能为 null / 空对象 / 部分字段的 notifications 与默认值逐字段合并，
 * 保证每个分类（priceAlerts / aiSignals / newsAlerts）都包含全部渠道开关，
 * 避免渲染时读取 undefined 属性导致崩溃。
 */
export function normalizeNotificationSettings(
  raw: DeepPartial<NotificationSettings> | null | undefined,
  defaults: NotificationSettings,
): NotificationSettings {
  return {
    priceAlerts: { ...EMPTY_PREF, ...defaults.priceAlerts, ...(raw?.priceAlerts ?? {}) },
    aiSignals: { ...EMPTY_PREF, ...defaults.aiSignals, ...(raw?.aiSignals ?? {}) },
    newsAlerts: { ...EMPTY_PREF, ...defaults.newsAlerts, ...(raw?.newsAlerts ?? {}) },
    systemUpdates: raw?.systemUpdates ?? defaults.systemUpdates,
  };
}
