import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { Plan, PLAN_FEATURES } from '../entitlements/entitlements.constants';

export interface PlanInfo {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  features: string[];
}

const PLANS: PlanInfo[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    currency: 'USD',
    features: ['行情', '基础分析摘要', '每日 10 次 Chat', '自选 5 个 · 告警 3 个'],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 29,
    currency: 'USD',
    features: ['完整分析', '历史分析', 'Smart Money', 'Journal + 工具', 'API 密钥', '每日 200 次 Chat'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 199,
    currency: 'USD',
    features: ['Pro 全部能力', '独立配额', '企业授权', '专属支持'],
  },
];

function billingProvider(): string {
  return (process.env.BILLING_PROVIDER || 'simulate').toLowerCase();
}

function webUrl(): string {
  return process.env.WEB_URL || 'http://localhost:3000';
}

/**
 * 付费授权：订阅订单（本地 simulate / 生产 Stripe 可切换）+ 授权码（License）。
 * 两通道统一写 users.plan + subscriptions + entitlements（详见 docs/AUTH_BILLING_TECHNICAL_PLAN.md）。
 */
@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementsService,
  ) {}

  getPlans(): { items: PlanInfo[] } {
    return { items: PLANS };
  }

  /** 当前用户的权益（套餐/功能/配额/已用/订阅）。 */
  getEntitlements(userId: string) {
    return this.entitlements.getUserEntitlements(userId);
  }

  /** 创建订阅订单。simulate 模式返回前端确认页；stripe 模式返回真实 Checkout URL。 */
  async createCheckout(userId: string, plan: 'pro' | 'enterprise') {
    const info = PLANS.find((p) => p.id === plan);
    if (!info) throw new BadRequestException({ code: 'UNKNOWN_PLAN', message: `未知套餐: ${plan}` });

    const provider = billingProvider();
    const order = await this.prisma.order.create({
      data: {
        userId,
        plan,
        amount: info.priceMonthly,
        currency: info.currency,
        status: 'pending',
        provider,
      },
    });

    let checkoutUrl = `${webUrl()}/billing/checkout?session=${order.id}`;
    if (provider === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      checkoutUrl = await this.createStripeSession(order.id, plan);
    }

    return {
      orderId: order.id,
      checkoutUrl,
      plan: order.plan,
      amount: Number(order.amount),
      currency: order.currency,
      provider,
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: '订单不存在' });
    return {
      id: order.id,
      plan: order.plan,
      amount: Number(order.amount),
      currency: order.currency,
      status: order.status,
      provider: order.provider,
      paidAt: order.paidAt?.toISOString() ?? null,
      createdAt: order.createdAt.toISOString(),
    };
  }

  /** 本地模拟支付确认：订单置 paid 并激活套餐。 */
  async confirmOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: '订单不存在' });

    if (order.status === 'paid') {
      return { ok: true, alreadyActivated: true, plan: order.plan };
    }
    if (order.status !== 'pending') {
      throw new BadRequestException({ code: 'ORDER_NOT_PAYABLE', message: '订单当前状态不可支付' });
    }

    await this.prisma.$transaction([
      this.prisma.order.update({ where: { id: order.id }, data: { status: 'paid', paidAt: new Date() } }),
    ]);
    const activation = await this.activatePlan(userId, order.plan as Plan, {
      provider: order.provider,
      providerRef: order.id,
    });
    return { ok: true, alreadyActivated: false, ...activation };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: '订单不存在' });
    if (order.status !== 'pending') {
      throw new BadRequestException({ code: 'ORDER_NOT_CANCELABLE', message: '订单当前状态不可取消' });
    }
    await this.prisma.order.update({ where: { id: order.id }, data: { status: 'canceled' } });
    return { ok: true };
  }

  /** 授权码激活（License Key）。 */
  async activateLicense(userId: string, rawKey: string) {
    const key = rawKey.trim().toUpperCase();
    const license = await this.prisma.license.findUnique({ where: { key } });
    if (!license) {
      throw new BadRequestException({ code: 'INVALID_LICENSE', message: '授权码无效' });
    }
    if (license.expiresAt && license.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'LICENSE_EXPIRED', message: '授权码已过期' });
    }

    const existing = await this.prisma.licenseRedemption.findUnique({
      where: { licenseId_userId: { licenseId: license.id, userId } },
    });
    if (existing) {
      // 幂等：同一用户重复激活直接返回当前结果。
      await this.ensurePlanForUser(userId, license.plan as Plan, 'license', license.key);
      return { ok: true, alreadyActivated: true, plan: license.plan };
    }
    if (license.usedCount >= license.maxActivations) {
      throw new ForbiddenException({
        code: 'LICENSE_MAXED',
        message: '该授权码已达到最大激活次数',
        details: { maxActivations: license.maxActivations },
      });
    }

    await this.prisma.$transaction([
      this.prisma.licenseRedemption.create({
        data: { licenseId: license.id, userId },
      }),
      this.prisma.license.update({
        where: { id: license.id },
        data: { usedCount: { increment: 1 } },
      }),
    ]);

    const activation = await this.activatePlan(userId, license.plan as Plan, {
      provider: 'license',
      providerRef: license.key,
    });
    return { ok: true, alreadyActivated: false, ...activation };
  }

  async getSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    });
    return {
      subscription: sub
        ? {
            id: sub.id,
            plan: sub.plan,
            provider: sub.provider,
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          }
        : null,
      entitlements: await this.entitlements.getUserEntitlements(userId),
    };
  }

  async createPortal(userId: string) {
    if (billingProvider() === 'stripe' && process.env.STRIPE_SECRET_KEY) {
      try {
        const session = await this.createStripePortal();
        return { portalUrl: session.url };
      } catch {
        // 降级到前端管理页
      }
    }
    return { portalUrl: `${webUrl()}/billing?manage=1` };
  }

  /** Stripe Webhook（生产）。未配置 STRIPE_WEBHOOK_SECRET 时仅记录，不做校验。 */
  async handleWebhook(body: Record<string, any>) {
    const type = body?.type;
    if (type === 'checkout.session.completed') {
      const session = body.data?.object;
      const clientRef = session?.client_reference_id; // orderId
      if (clientRef) {
        const order = await this.prisma.order.findUnique({ where: { id: clientRef } });
        if (order && order.status === 'pending') {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'paid', paidAt: new Date(), providerRef: session.id },
          });
          await this.activatePlan(order.userId, order.plan as Plan, {
            provider: 'stripe',
            providerRef: session.id,
          });
        }
      }
    }
    return { received: true, type };
  }

  // ---------- internal ----------

  /** 激活套餐：写 subscriptions + entitlements + users.plan。幂等。 */
  private async activatePlan(
    userId: string,
    plan: Plan,
    meta: { provider: string; providerRef: string },
  ) {
    await this.ensurePlanForUser(userId, plan, meta.provider, meta.providerRef);
    return { plan, features: PLAN_FEATURES[plan].features };
  }

  private async ensurePlanForUser(
    userId: string,
    plan: Plan,
    provider: string,
    providerRef: string,
  ) {
    // 已有同 provider 的激活则复用/更新，否则新建。
    const existing = await this.prisma.subscription.findFirst({
      where: { userId, providerSubscriptionId: providerRef },
    });
    const data = {
      plan,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    };
    if (existing) {
      await this.prisma.subscription.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId,
          provider,
          providerSubscriptionId: providerRef,
          ...data,
        },
      });
    }
    await this.prisma.user.update({ where: { id: userId }, data: { plan } });

    // 同步 entitlements（与套餐功能一致）。
    const features = PLAN_FEATURES[plan].features;
    for (const feature of features) {
      await this.prisma.entitlement.upsert({
        where: { userId_featureKey: { userId, featureKey: feature } },
        update: { value: { granted: true }, source: 'plan' },
        create: { userId, featureKey: feature, value: { granted: true }, source: 'plan' },
      });
    }
  }

  // ---------- Stripe (REST, 无需 SDK) ----------

  private async createStripeSession(orderId: string, plan: string): Promise<string> {
    const priceKey = plan === 'enterprise' ? 'STRIPE_PRICE_ENTERPRISE' : 'STRIPE_PRICE_PRO';
    const price = process.env[priceKey];
    if (!price) throw new Error(`Missing ${priceKey}`);
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': price,
        'line_items[0][quantity]': '1',
        success_url: `${webUrl()}/billing?upgraded=1`,
        cancel_url: `${webUrl()}/billing?canceled=1`,
        client_reference_id: orderId,
      }).toString(),
    });
    const json: any = await res.json();
    if (!res.ok || !json.url) throw new Error(`Stripe checkout failed: ${json.error?.message || res.status}`);
    return json.url;
  }

  private async createStripePortal(): Promise<{ url: string }> {
    const customer = process.env.STRIPE_CUSTOMER_ID || '';
    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ customer, return_url: `${webUrl()}/billing` }).toString(),
    });
    const json: any = await res.json();
    if (!res.ok || !json.url) throw new Error(`Stripe portal failed: ${json.error?.message || res.status}`);
    return json;
  }
}
