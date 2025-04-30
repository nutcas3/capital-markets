import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotGateway } from './bot.gateway';
import { WhatsappController } from './whatsapp.controller';
import { TradeModule } from '../trade/trade.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { WalletModule } from '../wallet/wallet.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TradeModule,
    PortfolioModule,
    WalletModule,
    AuthModule,
    ConfigModule
  ],
  controllers: [WhatsappController],
  providers: [BotService, BotGateway],
  exports: [BotService]
})
export class BotModule {}
