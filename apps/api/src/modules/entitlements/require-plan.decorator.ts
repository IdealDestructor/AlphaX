import { SetMetadata } from '@nestjs/common';
import { Plan } from '../entitlements/entitlements.constants';

export const REQUIRE_PLAN_KEY = 'require_plan';

/** 声明路由所需最低套餐，配合 PlanGuard 使用。 */
export const RequirePlan = (plan: Plan) => SetMetadata(REQUIRE_PLAN_KEY, plan);
