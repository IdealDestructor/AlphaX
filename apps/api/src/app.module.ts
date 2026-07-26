import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MarketModule } from './modules/market/market.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { SignalsModule } from './modules/signals/signals.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { NewsModule } from './modules/news/news.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { ChatModule } from './modules/chat/chat.module';
import { UserModule } from './modules/user/user.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 100 }] }),
    PrismaModule,
    AuthModule,
    MarketModule,
    AnalysisModule,
    SignalsModule,
    ForecastModule,
    NewsModule,
    AlertsModule,
    ChatModule,
    UserModule,
    DashboardModule,
  ],
})
export class AppModule {}
