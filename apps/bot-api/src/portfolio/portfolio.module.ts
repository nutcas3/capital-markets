import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { WalletModule } from '../wallet/wallet.module';
import { PriceOracleAdapterModule } from '@perena/price-oracle-adapter';

@Module({
  imports: [WalletModule, PriceOracleAdapterModule],
  providers: [PortfolioService],
  exports: [PortfolioService]
})
export class PortfolioModule {}
