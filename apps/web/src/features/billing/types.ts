export type PlanId = "free" | "pro" | "enterprise";

export interface PlanInfo {
  id: PlanId;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

export interface UserEntitlements {
  plan: PlanId;
  features: string[];
  quota: Partial<Record<"chatPerDay" | "watchlist" | "alerts", number>>;
  used: { watchlist: number; alerts: number; chatToday: number };
  subscription: {
    id: string;
    provider: string;
    status: string;
    plan: PlanId;
    currentPeriodEnd: string | null;
  } | null;
}

export interface CheckoutResult {
  orderId: string;
  checkoutUrl: string;
  plan: PlanId;
  amount: number;
  currency: string;
  provider: string;
}

export interface OrderInfo {
  id: string;
  plan: PlanId;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  paidAt: string | null;
  createdAt: string;
}
