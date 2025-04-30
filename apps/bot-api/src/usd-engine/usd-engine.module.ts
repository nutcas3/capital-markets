import { Module } from '@nestjs/common';
import { UsdEngineService } from './usd-engine.service';
import { PriceOracleAdapterModule } from '@perena/price-oracle-adapter';
import { NumeraireWrapperModule } from '@perena/numeraire-wrapper';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    PriceOracleAdapterModule,
    NumeraireWrapperModule,
    WalletModule
  ],
  providers: [UsdEngineService],
  exports: [UsdEngineService]
})
export class UsdEngineModule {}
