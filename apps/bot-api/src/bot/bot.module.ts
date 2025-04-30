import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotGateway } from './bot.gateway';
import { TradeModule } from '../trade/trade.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TradeModule,
    PortfolioModule,
    WalletModule,
    AuthModule
  ],
  providers: [BotService, BotGateway],
  exports: [BotService]
})
export class BotModule {}
