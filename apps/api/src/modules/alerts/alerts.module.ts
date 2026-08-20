import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AlertsService } from './alerts.service';

@Module({
  imports: [EntitlementsModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
