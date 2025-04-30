import { logger } from '@perena/utils';
import { NumeraireService } from '@perena/numeraire-wrapper';
import { PriceService } from '@perena/price-oracle-adapter';

export interface SyntheticAsset {
  symbol: string;
  name: string;
  baseAsset: string;
  oracleId: string;
  collateralRatio: number;
  mintable: boolean;
  redeemable: boolean;
}

export class SyntheticTokenEngine {
  private syntheticAssets: SyntheticAsset[] = [
    {
      symbol: 'xGOLD',
      name: 'Synthetic Gold',
      baseAsset: 'USDC',
      oracleId: 'GOLD/USD',
      collateralRatio: 1.5,
      mintable: true,
      redeemable: true
    },
    {
      symbol: 'xKES',
      name: 'Synthetic Kenyan Shilling',
      baseAsset: 'USDC',
      oracleId: 'KES/USD',
      collateralRatio: 1.2,
      mintable: true,
      redeemable: true
    },
    {
      symbol: 'xEUR',
      name: 'Synthetic Euro',
      baseAsset: 'USDC',
      oracleId: 'EUR/USD',
      collateralRatio: 1.1,
      mintable: true,
      redeemable: true
    }
  ];

  constructor(
    private readonly numeraireService: NumeraireService,
    private readonly priceService: PriceService
  ) {
    logger.info('SyntheticTokenEngine initialized');
  }

  async listSyntheticAssets(): Promise<SyntheticAsset[]> {
    return this.syntheticAssets;
  }

  async getSyntheticAsset(symbol: string): Promise<SyntheticAsset | null> {
    return this.syntheticAssets.find(asset => asset.symbol === symbol) || null;
  }

  async mintSyntheticAsset(
    walletAddress: string,
    assetSymbol: string,
    amount: number
  ): Promise<{ txHash: string; mintedAmount: number; collateralUsed: number }> {
    logger.info('Minting synthetic asset', { walletAddress, assetSymbol, amount });
    
    const asset = await this.getSyntheticAsset(assetSymbol);
    if (!asset) {
      throw new Error(`Synthetic asset ${assetSymbol} not found`);
    }

    if (!asset.mintable) {
      throw new Error(`Synthetic asset ${assetSymbol} is not mintable`);
    }

    // Get current price from oracle
    const price = await this.priceService.getPrice(asset.oracleId);
    
    // Calculate collateral needed based on price and collateral ratio
    const collateralNeeded = (amount * price.value) * asset.collateralRatio;
    
    // Execute mint transaction via Numeraire
    const result = await this.numeraireService.mintSynthetic({
      walletAddress,
      syntheticAsset: assetSymbol,
      amount,
      collateralAsset: asset.baseAsset,
      collateralAmount: collateralNeeded
    });

    return {
      txHash: result.txHash,
      mintedAmount: amount,
      collateralUsed: collateralNeeded
    };
  }

  async redeemSyntheticAsset(
    walletAddress: string,
    assetSymbol: string,
    amount: number
  ): Promise<{ txHash: string; redeemedAmount: number; collateralReturned: number }> {
    logger.info('Redeeming synthetic asset', { walletAddress, assetSymbol, amount });
    
    const asset = await this.getSyntheticAsset(assetSymbol);
    if (!asset) {
      throw new Error(`Synthetic asset ${assetSymbol} not found`);
    }

    if (!asset.redeemable) {
      throw new Error(`Synthetic asset ${assetSymbol} is not redeemable`);
    }

    // Get current price from oracle
    const price = await this.priceService.getPrice(asset.oracleId);
    
    // Calculate collateral to return based on price and collateral ratio
    const collateralToReturn = (amount * price.value) * asset.collateralRatio;
    
    // Execute redeem transaction via Numeraire
    const result = await this.numeraireService.redeemSynthetic({
      walletAddress,
      syntheticAsset: assetSymbol,
      amount,
      collateralAsset: asset.baseAsset
    });

    return {
      txHash: result.txHash,
      redeemedAmount: amount,
      collateralReturned: collateralToReturn
    };
  }

  async getSyntheticAssetPrice(assetSymbol: string): Promise<{ price: number; change24h: number }> {
    logger.info('Getting synthetic asset price', { assetSymbol });
    
    const asset = await this.getSyntheticAsset(assetSymbol);
    if (!asset) {
      throw new Error(`Synthetic asset ${assetSymbol} not found`);
    }

    const priceData = await this.priceService.getPrice(asset.oracleId);
    return {
      price: priceData.value,
      change24h: priceData.change24h
    };
  }
}
