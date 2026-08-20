import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { CheckoutDto, LicenseActivateDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(private billing: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billing.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('entitlements')
  getEntitlements(@CurrentUser('id') userId: string) {
    return this.billing.getEntitlements(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSubscription(@CurrentUser('id') userId: string) {
    return this.billing.getSubscription(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  createCheckout(@CurrentUser('id') userId: string, @Body() dto: CheckoutDto) {
    return this.billing.createCheckout(userId, dto.plan);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  getOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.billing.getOrder(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/confirm')
  confirmOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.billing.confirmOrder(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('orders/:id/cancel')
  cancelOrder(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.billing.cancelOrder(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('license/activate')
  activateLicense(@CurrentUser('id') userId: string, @Body() dto: LicenseActivateDto) {
    return this.billing.activateLicense(userId, dto.licenseKey);
  }

  @UseGuards(JwtAuthGuard)
  @Get('portal')
  createPortal(@CurrentUser('id') userId: string) {
    return this.billing.createPortal(userId);
  }

  /** Stripe Webhook（生产）。本地 simulate 模式不会被调用。 */
  @Post('webhook')
  handleWebhook(@Req() req: Request) {
    return this.billing.handleWebhook(req.body as Record<string, any>);
  }
}
