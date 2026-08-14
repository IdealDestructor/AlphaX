import { Controller, Get, Param } from '@nestjs/common';
import { SentimentService } from './sentiment.service';

@Controller('sentiment')
export class SentimentController {
  constructor(private sentiment: SentimentService) {}

  /** Aggregate sentiment across symbols (optionally filter by ?symbol via list). */
  @Get()
  getSentiment() {
    return this.sentiment.getSentiment();
  }

  @Get(':symbol')
  getSentimentBySymbol(@Param('symbol') symbol: string) {
    return this.sentiment.getSentimentBySymbol(symbol.toUpperCase());
  }
}
