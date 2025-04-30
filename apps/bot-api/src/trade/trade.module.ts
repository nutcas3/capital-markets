import { Module } from '@nestjs/common';
import { TradeService } from './trade.service';
import { NumeraireWrapperModule } from '@perena/numeraire-wrapper';
import { PriceOracleAdapterModule } from '@perena/price-oracle-adapter';
import { NotificationServiceModule } from '@perena/notification-service';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [
    NumeraireWrapperModule,
    PriceOracleAdapterModule,
    NotificationServiceModule,
    BotModule
  ],
  providers: [TradeService],
  exports: [TradeService]
})
export class TradeModule {}
