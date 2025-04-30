import { Module } from '@nestjs/common';
import { SyntheticAssetsService } from './synthetic-assets.service';
import { PriceOracleAdapterModule } from '@perena/price-oracle-adapter';
import { NumeraireWrapperModule } from '@perena/numeraire-wrapper';

@Module({
  imports: [PriceOracleAdapterModule, NumeraireWrapperModule],
  providers: [SyntheticAssetsService],
  exports: [SyntheticAssetsService]
})
export class SyntheticAssetsModule {}
