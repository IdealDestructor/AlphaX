import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Plan,
  FeatureKey,
  QuotaKey,
  PLAN_FEATURES,
  REQUIRED_PLAN,
  planAtLeast,
} from './entitlements.constants';

export interface UserEntitlements {
  plan: Plan;
  features: FeatureKey[];
  quota: Partial<Record<QuotaKey, number>>;
  used: { watchlist: number; alerts: number; chatToday: number };
  subscription: {
    id: string;
    provider: string;
    status: string;
    plan: Plan;
    currentPeriodEnd: string | null;
  } | null;
}

/**
 * 权益与配额服务（后端强制门控的事实源）。
 * 前端只是体验层；真正的边界在这里 + RequirePlan 守卫。
 */
@Injectable()
export class EntitlementsService {
  constructor(private prisma: PrismaService) {}

  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: '用户不存在' });

    const plan = user.plan as Plan;
    const config = PLAN_FEATURES[plan];

    const [watchlist, alerts, chatToday, subscription] = await Promise.all([
      this.prisma.watchlist.count({ where: { userId } }),
      this.prisma.alert.count({ where: { userId, status: 'active' } }),
      this.prisma.chatMessage.count({
        where: {
          session: { userId },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.subscription.findFirst({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      plan,
      features: config.features,
      quota: config.quota,
      used: { watchlist, alerts, chatToday },
      subscription: subscription
        ? {
            id: subscription.id,
            provider: subscription.provider,
            status: subscription.status,
            plan: subscription.plan as Plan,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          }
        : null,
    };
  }

  /**
   * 校验功能访问权。不满足时抛 403 FORBIDDEN（含 requiredPlan / currentPlan / feature）。
   */
  async assertFeature(userId: string, feature: FeatureKey, required?: Plan): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });
    if (!user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '请先登录' });

    const currentPlan = user.plan as Plan;
    const requiredPlan = required ?? REQUIRED_PLAN[feature] ?? 'pro';
    const config = PLAN_FEATURES[currentPlan];

    const ok =
      config.features.includes(feature) || planAtLeast(currentPlan, requiredPlan);
    if (!ok) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `${requiredPlan === 'enterprise' ? 'Enterprise' : 'Pro'} 套餐才能使用该功能`,
        details: { feature, requiredPlan, currentPlan },
      });
    }
  }

  /** 配额不足时抛 403 QUOTA_EXCEEDED。 */
  async assertQuota(userId: string, key: QuotaKey): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });
    if (!user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '请先登录' });

    const plan = user.plan as Plan;
    const quota = PLAN_FEATURES[plan].quota[key];
    if (quota === undefined) return;

    let used = 0;
    if (key === 'watchlist') {
      used = await this.prisma.watchlist.count({ where: { userId } });
    } else if (key === 'alerts') {
      used = await this.prisma.alert.count({ where: { userId, status: 'active' } });
    } else if (key === 'chatPerDay') {
      used = await this.prisma.chatMessage.count({
        where: {
          session: { userId },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      });
    }

    if (used >= quota) {
      throw new ForbiddenException({
        code: 'QUOTA_EXCEEDED',
        message: `已达到当前套餐上限（${key}: ${quota}），升级可提升额度`,
        details: { key, used, quota, plan },
      });
    }
  }
}
