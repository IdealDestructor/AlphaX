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
import { JournalModule } from './modules/journal/journal.module';
import { ToolsModule } from './modules/tools/tools.module';
import { SentimentModule } from './modules/sentiment/sentiment.module';
import { SmartMoneyModule } from './modules/smart-money/smart-money.module';
import { BillingModule } from './modules/billing/billing.module';
import { EntitlementsModule } from './modules/entitlements/entitlements.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';

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
    JournalModule,
    ToolsModule,
    SentimentModule,
    SmartMoneyModule,
    BillingModule,
    EntitlementsModule,
    WatchlistModule,
    ApiKeysModule,
  ],
})
export class AppModule {}
