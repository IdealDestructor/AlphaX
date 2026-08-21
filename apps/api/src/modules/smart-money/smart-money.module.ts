import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { SmartMoneyController } from './smart-money.controller';
import { SmartMoneyService } from './smart-money.service';
import { CotProvider } from './providers/cot.provider';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [SmartMoneyController],
  providers: [SmartMoneyService, CotProvider],
  exports: [SmartMoneyService],
})
export class SmartMoneyModule {}
