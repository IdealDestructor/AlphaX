import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { REQUIRE_PLAN_KEY } from './require-plan.decorator';
import { Plan, planAtLeast } from './entitlements.constants';

/**
 * 路由级套餐门控：读取 @RequirePlan('pro') 元数据，
 * 校验当前用户 plan 是否达标，否则 403 FORBIDDEN。
 */
@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Plan | undefined>(REQUIRE_PLAN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '请先登录' });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, plan: true },
    });
    if (!user) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: '用户不存在' });

    const currentPlan = user.plan as Plan;
    if (!planAtLeast(currentPlan, required)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `${required === 'enterprise' ? 'Enterprise' : 'Pro'} 套餐才能使用该功能`,
        details: { requiredPlan: required, currentPlan },
      });
    }
    return true;
  }
}
