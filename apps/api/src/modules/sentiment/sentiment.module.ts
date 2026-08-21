import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SentimentController } from './sentiment.controller';
import { SentimentService } from './sentiment.service';
import { FearGreedProvider } from './providers/fear-greed.provider';

@Module({
  imports: [PrismaModule],
  controllers: [SentimentController],
  providers: [SentimentService, FearGreedProvider],
  exports: [SentimentService],
})
export class SentimentModule {}
