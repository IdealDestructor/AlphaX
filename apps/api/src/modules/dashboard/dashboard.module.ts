import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { MarketModule } from '../market/market.module';
import { SentimentModule } from '../sentiment/sentiment.module';
import { SmartMoneyModule } from '../smart-money/smart-money.module';

@Module({
  imports: [MarketModule, SentimentModule, SmartMoneyModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
