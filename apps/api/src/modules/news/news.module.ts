import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsRssService } from './rss/news-rss.service';

@Module({
  imports: [PrismaModule],
  controllers: [NewsController],
  providers: [NewsService, NewsRssService],
})
export class NewsModule {}
