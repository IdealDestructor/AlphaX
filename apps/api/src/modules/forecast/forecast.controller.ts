import { Controller, Get, Query } from '@nestjs/common';
import { ForecastService } from './forecast.service';

@Controller('forecast')
export class ForecastController {
  constructor(private forecast: ForecastService) {}

  @Get()
  getForecasts(@Query('symbol') symbol?: string) {
    return this.forecast.getForecasts(symbol);
  }

  @Get('latest')
  getForecast(@Query('symbol') symbol: string, @Query('horizon') horizon?: string) {
    return this.forecast.getForecast(symbol, horizon || '1w');
  }
}
