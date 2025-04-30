import { Injectable } from '@nestjs/common';
import { PriceService } from '@perena/price-oracle-adapter';
import { NumeraireService } from '@perena/numeraire-wrapper';
import { logger } from '@perena/utils';
import * as usdEngineLib from '../../../libs/capital-markets/usdEngine';

export interface StablecoinInfo {
  symbol: string;
  name: string;
  issuer: string;
  collateralRatio: number;
  yieldApy: number;
  totalSupply: number;
  isYieldBearing: boolean;
}

@Injectable()
export class UsdEngine {
  private stablecoins: StablecoinInfo[] = [
    {
      symbol: 'USDC',
      name: 'USD Coin',
      issuer: 'Circle',
      collateralRatio: 1.0,
      yieldApy: 0,
      totalSupply: 50000000000,
      isYieldBearing: false
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      issuer: 'Tether',
      collateralRatio: 1.0,
      yieldApy: 0,
      totalSupply: 80000000000,
      isYieldBearing: false
    },
    {
      symbol: 'yUSDC',
      name: 'Yield-bearing USDC',
      issuer: 'Perena',
      collateralRatio: 1.0,
      yieldApy: 4.5,
      totalSupply: 1000000000,
      isYieldBearing: true
    }
  ];

  constructor(
    private readonly numeraireService: NumeraireService,
    private readonly priceService: PriceService
  ) {}

  async listStablecoins(): Promise<StablecoinInfo[]> {
    // Update yield APY from on-chain data
    await this.updateYieldRates();
    return this.stablecoins;
  }

  async getStablecoin(symbol: string): Promise<StablecoinInfo | null> {
    const stablecoin = this.stablecoins.find(coin => coin.symbol === symbol);
    if (stablecoin && stablecoin.isYieldBearing) {
      // Get latest yield rate for yield-bearing stablecoins
      const yieldRate = await this.getYieldRate(symbol);
      stablecoin.yieldApy = yieldRate;
    }
    return stablecoin || null;
  }

  async depositUsd(
    walletAddress: string,
    amount: number,
    stablecoinSymbol: string = 'USDC'
  ): Promise<{ txHash: string; depositedAmount: number }> {
    logger.info('Depositing USD', { walletAddress, amount, stablecoinSymbol });
    
    // This would typically handle fiat on-ramp integration
    // For now, simulate a deposit by minting stablecoins
    
    const result = await this.numeraireService.mintStablecoin({
      walletAddress,
      stablecoin: stablecoinSymbol,
      amount
    });

    return {
      txHash: result.txHash,
      depositedAmount: amount
    };
  }

  async withdrawUsd(
    walletAddress: string,
    amount: number,
    stablecoinSymbol: string = 'USDC'
  ): Promise<{ txHash: string; withdrawnAmount: number }> {
    logger.info('Withdrawing USD', { walletAddress, amount, stablecoinSymbol });
    
    // This would typically handle fiat off-ramp integration
    // For now, simulate a withdrawal by burning stablecoins
    
    const result = await this.numeraireService.burnStablecoin({
      walletAddress,
      stablecoin: stablecoinSymbol,
      amount
    });

    return {
      txHash: result.txHash,
      withdrawnAmount: amount
    };
  }

  async convertToYieldBearing(
    walletAddress: string,
    amount: number,
    fromStablecoin: string = 'USDC'
  ): Promise<{ txHash: string; yieldTokenAmount: number }> {
    logger.info('Converting to yield-bearing stablecoin', { walletAddress, amount, fromStablecoin });
    
    // Convert regular stablecoin to yield-bearing version
    const yieldVersion = `y${fromStablecoin}`;
    
    // Check if yield version exists
    const yieldToken = this.stablecoins.find(coin => coin.symbol === yieldVersion);
    if (!yieldToken) {
      throw new Error(`No yield-bearing version available for ${fromStablecoin}`);
    }
    
    // Execute conversion via Numeraire
    const result = await this.numeraireService.convertToYieldBearing({
      walletAddress,
      stablecoin: fromStablecoin,
      amount
    });

    return {
      txHash: result.txHash,
      yieldTokenAmount: amount // 1:1 conversion ratio
    };
  }

  async redeemFromYieldBearing(
    walletAddress: string,
    amount: number,
    yieldStablecoin: string = 'yUSDC'
  ): Promise<{ txHash: string; baseTokenAmount: number; yieldEarned: number }> {
    logger.info('Redeeming from yield-bearing stablecoin', { walletAddress, amount, yieldStablecoin });
    
    // Convert yield-bearing stablecoin back to regular version
    const baseToken = yieldStablecoin.replace('y', '');
    
    // Calculate yield earned
    const yieldInfo = await this.getYieldInfo(walletAddress, yieldStablecoin, amount);
    
    // Execute conversion via Numeraire
    const result = await this.numeraireService.redeemFromYieldBearing({
      walletAddress,
      stablecoin: yieldStablecoin,
      amount
    });

    return {
      txHash: result.txHash,
      baseTokenAmount: amount, // 1:1 conversion ratio for principal
      yieldEarned: yieldInfo.yieldEarned
    };
  }

  async getUsdPrice(): Promise<number> {
    logger.info('Getting USD price');
    
    try {
      // Use the libs implementation
      return await usdEngineLib.getUsdStarPrice(process.env.NUMERAIRE_POOL_ID || '');
    } catch (error) {
      logger.error('Error getting USD price', error);
      // Fallback to 1.0 if there's an error, as USD is pegged to $1
      return 1.0;
    }
  }

  async mintUsd(params: any): Promise<any> {
    logger.info('Minting USD', params);
    
    try {
      // Use the libs implementation
      const result = await usdEngineLib.mintUsdStar({
        walletAddress: params.walletAddress,
        collateralToken: params.collateralToken,
        collateralAmount: params.collateralAmount,
        usdAmount: params.usdAmount,
        slippageTolerance: params.slippageTolerance || 0.005,
        priceOracle: this.priceService, // Pass the price service for price lookups
        numerairePool: process.env.NUMERAIRE_POOL_ID || ''
      });
      
      return {
        txHash: result.txHash,
        usdAmount: result.usdAmount,
        collateralAmount: result.collateralAmount,
        collateralToken: result.collateralToken,
        collateralizationRatio: result.collateralizationRatio
      };
    } catch (error) {
      logger.error('Error minting USD', error);
      throw new Error(`Failed to mint USD: ${error.message}`);
    }
  }

  async getYieldRate(stablecoinSymbol: string): Promise<number> {
    logger.info('Getting yield rate', { stablecoinSymbol });
    
    try {
      // Use the libs implementation if available
      if (usdEngineLib.getYieldRate) {
        return await usdEngineLib.getYieldRate(stablecoinSymbol, process.env.NUMERAIRE_POOL_ID || '');
      }
      
      // Fallback to static values
      if (stablecoinSymbol === 'yUSDC') {
        return 0.045; // 4.5% APY
      } else if (stablecoinSymbol === 'yUSDT') {
        return 0.042; // 4.2% APY
      } else {
        return 0.04; // 4.0% APY default
      }
    } catch (error) {
      logger.error('Error getting yield rate', error);
      return 0.04; // Default fallback
    }
  }

  async getYieldInfo(
    walletAddress: string,
    yieldStablecoin: string,
    amount?: number
  ): Promise<{ principal: number; yieldEarned: number; apy: number }> {
    logger.info('Getting yield info', { walletAddress, yieldStablecoin, amount });
    
    // Get current yield rate
    const apy = await this.getYieldRate(yieldStablecoin);
    
    // Calculate yield earned (simplified)
    // In a real implementation, this would calculate based on deposit time
    const yieldEarned = (amount || 0) * (apy / 100) * (30 / 365); // Assume 30 days of yield
    
    return {
      principal: amount || 0,
      yieldEarned,
      apy
    };
  }

  private async updateYieldRates(): Promise<void> {
    // Update yield rates for all yield-bearing stablecoins
    for (const stablecoin of this.stablecoins) {
      if (stablecoin.isYieldBearing) {
        stablecoin.yieldAPY = await this.getYieldRate(stablecoin.symbol);
      }
    }
  }
}
