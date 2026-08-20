import { Module } from '@nestjs/common';
import { EntitlementsService } from './entitlements.service';
import { PlanGuard } from './plan.guard';

@Module({
  providers: [EntitlementsService, PlanGuard],
  exports: [EntitlementsService, PlanGuard],
})
export class EntitlementsModule {}
