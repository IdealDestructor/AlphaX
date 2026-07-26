import { Controller, Get, Param, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private news: NewsService) {}

  @Get()
  getNews(
    @Query('symbol') symbol?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.news.getNews(symbol, limit || 50, offset || 0);
  }

  @Get(':id')
  getNewsById(@Param('id') id: string) {
    return this.news.getNewsById(id);
  }
}
