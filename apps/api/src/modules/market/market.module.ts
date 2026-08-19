import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketDataRegistry } from './providers/registry';

@Module({
  controllers: [MarketController],
  providers: [MarketService, MarketDataRegistry],
  exports: [MarketService],
})
export class MarketModule {}
