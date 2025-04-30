import { Module } from '@nestjs/common';
import { NumeraireWrapperModule } from '@perena/numeraire-wrapper';
import { PriceOracleAdapterModule } from '@perena/price-oracle-adapter';
import { UsdEngine } from './usd-engine';
import { SyntheticTokenEngine } from './synthetic-token-engine';
import { RiskExposureModule } from './risk-exposure-module';
import { YieldCurveAggregator } from './yield-curve-aggregator';

@Module({
  imports: [
    NumeraireWrapperModule,
    PriceOracleAdapterModule
  ],
  providers: [
    UsdEngine,
    SyntheticTokenEngine,
    RiskExposureModule,
    YieldCurveAggregator
  ],
  exports: [
    UsdEngine,
    SyntheticTokenEngine,
    RiskExposureModule,
    YieldCurveAggregator
  ]
})
export class CapitalMarketsModule {}
