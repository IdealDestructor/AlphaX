import { Module } from '@nestjs/common';
import { MarketController } from './market.controller';
import { MarketService } from './market.service';
import { MarketDataRegistry } from './providers/registry';
import { MarketCacheService } from './cache/market-cache.service';

@Module({
  controllers: [MarketController],
  providers: [MarketService, MarketDataRegistry, MarketCacheService],
  exports: [MarketService, MarketDataRegistry, MarketCacheService],
})
export class MarketModule {}
