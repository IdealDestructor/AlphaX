import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SentimentController } from './sentiment.controller';
import { SentimentService } from './sentiment.service';

@Module({
  imports: [PrismaModule],
  controllers: [SentimentController],
  providers: [SentimentService],
  exports: [SentimentService],
})
export class SentimentModule {}
