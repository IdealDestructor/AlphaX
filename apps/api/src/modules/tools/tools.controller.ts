import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { PositionCalculatorDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlanGuard } from '../entitlements/plan.guard';
import { RequirePlan } from '../entitlements/require-plan.decorator';

@UseGuards(JwtAuthGuard, PlanGuard)
@RequirePlan('pro')
@Controller('tools')
export class ToolsController {
  constructor(private tools: ToolsService) {}

  @Post('position-calculator')
  positionCalculator(@Body() dto: PositionCalculatorDto) {
    return this.tools.positionCalculator(dto);
  }
}
