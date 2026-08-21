import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsRssService } from './rss/news-rss.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('news')
export class NewsController {
  constructor(
    private news: NewsService,
    private rss: NewsRssService,
  ) {}

  @Get()
  getNews(
    @Query('symbol') symbol?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.news.getNews(symbol, limit || 50, offset || 0);
  }

  /** 手动触发 RSS 摄入（幂等 upsert，用于验证/排障；定时任务待 P2）。 */
  @UseGuards(JwtAuthGuard)
  @Post('sync')
  syncNews() {
    return this.rss.syncAll();
  }

  @Get(':id')
  getNewsById(@Param('id') id: string) {
    return this.news.getNewsById(id);
  }
}
