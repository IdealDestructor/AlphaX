import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

/** Spec-compliant top-level `/watchlist` alias over the user watchlist store. */
@Module({
  imports: [PrismaModule],
  controllers: [WatchlistController],
  providers: [WatchlistService],
  exports: [WatchlistService],
})
export class WatchlistModule {}
