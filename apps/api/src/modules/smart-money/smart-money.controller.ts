import { Controller, Get, Param, Query } from '@nestjs/common';
import { SmartMoneyService } from './smart-money.service';

@Controller('smart-money')
export class SmartMoneyController {
  constructor(private smartMoney: SmartMoneyService) {}

  @Get()
  getSmartMoney() {
    return this.smartMoney.getSmartMoney();
  }

  @Get('history')
  getSmartMoneyHistory(
    @Query('symbol') symbol: string,
    @Query('days') days?: number,
    @Query('limit') limit?: number,
  ) {
    return this.smartMoney.getSmartMoneyHistory((symbol || 'XAUUSD').toUpperCase(), days || 14, limit || 30);
  }

  @Get(':symbol')
  getSmartMoneyBySymbol(@Param('symbol') symbol: string) {
    return this.smartMoney.getSmartMoneyBySymbol(symbol.toUpperCase());
  }
}
