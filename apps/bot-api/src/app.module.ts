import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { TradeModule } from './trade/trade.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { UsdEngineModule } from './usd-engine/usd-engine.module';
import { SyntheticAssetsModule } from './synthetic-assets/synthetic-assets.module';
import { KycModule } from './kyc/kyc.module';
import { BotModule } from './bot/bot.module';
import { LoggerModule } from './logger/logger.module';
import { config } from './config/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config]
    }),
    AuthModule,
    WalletModule,
    TradeModule,
    PortfolioModule,
    UsdEngineModule,
    SyntheticAssetsModule,
    KycModule,
    BotModule,
    LoggerModule
  ]
})
export class AppModule {}
