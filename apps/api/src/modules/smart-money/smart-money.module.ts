import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SmartMoneyController } from './smart-money.controller';
import { SmartMoneyService } from './smart-money.service';

@Module({
  imports: [PrismaModule],
  controllers: [SmartMoneyController],
  providers: [SmartMoneyService],
})
export class SmartMoneyModule {}
