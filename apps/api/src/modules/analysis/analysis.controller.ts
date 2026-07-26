import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private analysis: AnalysisService) {}

  @Get(':symbol')
  getAnalysis(@Param('symbol') symbol: string, @Query('timeframe') timeframe?: string) {
    return this.analysis.getAnalysis(symbol, timeframe || '1d');
  }

  @Get(':symbol/history')
  getHistory(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: number,
  ) {
    return this.analysis.getHistory(symbol, timeframe || '1d', limit || 20);
  }
}
