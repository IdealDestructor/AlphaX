import { describe, it, expect } from "vitest";
import { normalizeNotificationSettings } from "./normalize";
import type { NotificationSettings } from "./types";

const DEFAULTS: NotificationSettings = {
  priceAlerts: { email: true, webPush: true, telegram: false },
  aiSignals: { email: true, webPush: false, telegram: false },
  newsAlerts: { email: false, webPush: true, telegram: false },
  systemUpdates: true,
};

describe("normalizeNotificationSettings", () => {
  it("fills every section/channel when backend returns an empty object (new-user DB default)", () => {
    expect(normalizeNotificationSettings({}, DEFAULTS)).toEqual(DEFAULTS);
  });

  it("returns defaults for null/undefined", () => {
    expect(normalizeNotificationSettings(null, DEFAULTS)).toEqual(DEFAULTS);
    expect(normalizeNotificationSettings(undefined, DEFAULTS)).toEqual(DEFAULTS);
  });

  it("merges partial sections with defaults", () => {
    const result = normalizeNotificationSettings(
      { priceAlerts: { email: false, webPush: true, telegram: true }, systemUpdates: false },
      DEFAULTS,
    );
    expect(result.priceAlerts).toEqual({ email: false, webPush: true, telegram: true });
    expect(result.aiSignals).toEqual(DEFAULTS.aiSignals);
    expect(result.newsAlerts).toEqual(DEFAULTS.newsAlerts);
    expect(result.systemUpdates).toBe(false);
  });

  it("merges partial channel overrides inside a section", () => {
    const result = normalizeNotificationSettings({ newsAlerts: { telegram: true } }, DEFAULTS);
    expect(result.newsAlerts).toEqual({ email: false, webPush: true, telegram: true });
  });
});
