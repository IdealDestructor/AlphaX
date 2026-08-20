import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { SmartMoneyController } from './smart-money.controller';
import { SmartMoneyService } from './smart-money.service';

@Module({
  imports: [PrismaModule, EntitlementsModule],
  controllers: [SmartMoneyController],
  providers: [SmartMoneyService],
})
export class SmartMoneyModule {}
