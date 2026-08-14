import { Controller, Get, Param, Query } from '@nestjs/common';
import { SignalsService } from './signals.service';

@Controller('signals')
export class SignalsController {
  constructor(private signals: SignalsService) {}

  @Get()
  getSignals(@Query('symbol') symbol?: string, @Query('limit') limit?: number) {
    return this.signals.getSignals(symbol, limit || 50);
  }

  @Get('stats')
  getStats() {
    return this.signals.getStats();
  }

  @Get(':id')
  getSignalById(@Param('id') id: string) {
    return this.signals.getSignalById(id);
  }
}
