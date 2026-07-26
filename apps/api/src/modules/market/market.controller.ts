import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from './market.service';
import { QuoteQuery, CandleQuery, IndicatorsQuery } from './dto';

@Controller('market')
export class MarketController {
  constructor(private market: MarketService) {}

  @Get('symbols')
  getSymbols() {
    return this.market.getSymbols();
  }

  @Get('quotes')
  getQuotes(@Query() query: QuoteQuery) {
    return this.market.getQuotes(query.symbols);
  }

  @Get('candles')
  getCandles(@Query() query: CandleQuery) {
    return this.market.getCandles(query.symbol, query.interval!, query.limit!);
  }

  @Get('indicators')
  getIndicators(@Query() query: IndicatorsQuery) {
    return this.market.getIndicators(query.symbol, query.interval!, query.indicators || []);
  }
}
