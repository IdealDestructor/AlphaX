import { Injectable } from '@nestjs/common';

export interface PlanInfo {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

/**
 * Subscription plans. Checkout/portal return deterministic placeholder URLs;
 * swap `checkout` for a real Stripe Checkout session when STRIPE_SECRET_KEY is
 * configured (see docs/MONETIZATION.md).
 */
@Injectable()
export class BillingService {
  private readonly plans: PlanInfo[] = [
    {
      id: 'free',
      name: 'Free',
      priceMonthly: 0,
      currency: 'USD',
      features: ['行情', '基础分析摘要', '每日 10 次 Chat'],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceMonthly: 29,
      currency: 'USD',
      features: ['完整分析', '历史分析', 'Smart Money', '每日 200 次 Chat'],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceMonthly: 199,
      currency: 'USD',
      features: ['API 密钥', '独立配额', '专属支持'],
    },
  ];

  getPlans(): { items: PlanInfo[] } {
    return { items: this.plans };
  }

  createCheckout(planId: string) {
    const plan = this.plans.find((p) => p.id === planId);
    if (!plan) {
      return { error: 'UNKNOWN_PLAN', message: `Unknown plan: ${planId}` };
    }
    return {
      checkoutUrl: `https://checkout.alphax.example/start?plan=${plan.id}&price=${plan.priceMonthly}`,
      plan: plan.id,
      price: plan.priceMonthly,
      currency: plan.currency,
    };
  }

  createPortal() {
    return { portalUrl: 'https://billing.alphax.example/portal' };
  }
}
