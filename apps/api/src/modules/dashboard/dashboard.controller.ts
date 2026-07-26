import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @Get(':symbol')
  getDashboard(@Param('symbol') symbol: string) {
    return this.service.getDashboard(symbol.toUpperCase());
  }
}
