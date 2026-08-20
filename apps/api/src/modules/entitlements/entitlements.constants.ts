export type Plan = "free" | "pro" | "enterprise";

export type FeatureKey =
  | "market"
  | "analysis"
  | "news"
  | "chat"
  | "alerts"
  | "watchlist"
  | "forecast"
  | "signals"
  | "smart-money"
  | "journal"
  | "tools"
  | "analysis-history"
  | "api-keys"
  | "enterprise";

export type QuotaKey = "chatPerDay" | "watchlist" | "alerts";

export const PLAN_LEVEL: Record<Plan, number> = { free: 0, pro: 1, enterprise: 2 };

/**
 * 单一事实源：套餐 → 功能与配额（对齐 docs/MONETIZATION.md §2 / §3）。
 * 后端强制校验以此为准；前端展示层可调用 GET /billing/entitlements 获取当前用户实际权益。
 */
export const PLAN_FEATURES: Record<
  Plan,
  { features: FeatureKey[]; quota: Partial<Record<QuotaKey, number>> }
> = {
  free: {
    features: ["market", "analysis", "news", "chat", "alerts", "watchlist"],
    quota: { chatPerDay: 10, watchlist: 5, alerts: 3 },
  },
  pro: {
    features: [
      "market",
      "analysis",
      "news",
      "chat",
      "alerts",
      "watchlist",
      "forecast",
      "signals",
      "smart-money",
      "journal",
      "tools",
      "analysis-history",
      "api-keys",
    ],
    quota: { chatPerDay: 200, watchlist: 50, alerts: 50 },
  },
  enterprise: {
    features: [
      "market",
      "analysis",
      "news",
      "chat",
      "alerts",
      "watchlist",
      "forecast",
      "signals",
      "smart-money",
      "journal",
      "tools",
      "analysis-history",
      "api-keys",
      "enterprise",
    ],
    quota: { chatPerDay: 2000, watchlist: 500, alerts: 500 },
  },
};

/** 某个功能所需的最低套餐（默认 pro）。 */
export const REQUIRED_PLAN: Partial<Record<FeatureKey, Plan>> = {
  "smart-money": "pro",
  journal: "pro",
  tools: "pro",
  "analysis-history": "pro",
  "api-keys": "pro",
  enterprise: "enterprise",
  forecast: "pro",
  signals: "pro",
};

export function planAtLeast(current: Plan, required: Plan): boolean {
  return PLAN_LEVEL[current] >= PLAN_LEVEL[required];
}

export const ALL_PLANS: Plan[] = ["free", "pro", "enterprise"];
