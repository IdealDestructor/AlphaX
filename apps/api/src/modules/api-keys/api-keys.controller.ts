import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../entitlements/plan.guard';
import { RequirePlan } from '../entitlements/require-plan.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('pro')
@Controller('enterprise/api-keys')
export class ApiKeysController {
  constructor(private apiKeys: ApiKeysService) {}

  @Get()
  listKeys(@CurrentUser('id') userId: string) {
    return this.apiKeys.listKeys(userId);
  }

  @Post()
  createKey(
    @CurrentUser('id') userId: string,
    @Body('name') name: string,
    @Body('scopes') scopes?: string[],
  ) {
    return this.apiKeys.createKey(userId, name, scopes || ['market', 'analysis']);
  }

  @Delete(':id')
  revokeKey(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.apiKeys.revokeKey(userId, id);
  }
}
