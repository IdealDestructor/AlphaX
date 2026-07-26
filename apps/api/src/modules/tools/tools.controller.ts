import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { PositionCalculatorDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tools')
export class ToolsController {
  constructor(private tools: ToolsService) {}

  @Post('position-calculator')
  positionCalculator(@Body() dto: PositionCalculatorDto) {
    return this.tools.positionCalculator(dto);
  }
}
