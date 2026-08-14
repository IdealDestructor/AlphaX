import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BillingService, PlanInfo } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans')
  getPlans(): { items: PlanInfo[] } {
    return this.billing.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(@Body('plan') plan: string) {
    return this.billing.createCheckout(plan);
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal')
  createPortal() {
    return this.billing.createPortal();
  }
}
