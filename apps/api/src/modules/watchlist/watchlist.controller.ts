import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('watchlist')
export class WatchlistController {
  constructor(private watchlist: WatchlistService) {}

  @Get()
  getWatchlist(@CurrentUser('id') userId: string) {
    return this.watchlist.getWatchlist(userId);
  }

  @Post()
  addWatchlist(@CurrentUser('id') userId: string, @Body('symbol') symbol: string) {
    return this.watchlist.addWatchlist(userId, symbol);
  }

  @Delete(':symbol')
  removeWatchlist(@CurrentUser('id') userId: string, @Param('symbol') symbol: string) {
    return this.watchlist.removeWatchlist(userId, symbol);
  }
}
