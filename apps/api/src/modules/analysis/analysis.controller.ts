import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

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

  /** Force a fresh decision-pipeline run and persist the result (Pro feature per API_SPEC). */
  @UseGuards(JwtAuthGuard)
  @Post(':symbol/refresh')
  refreshAnalysis(@Param('symbol') symbol: string, @Query('timeframe') timeframe?: string) {
    return this.analysis.refreshAnalysis(symbol, timeframe || '1d');
  }
}
