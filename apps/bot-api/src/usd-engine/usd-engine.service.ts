import { Injectable } from '@nestjs/common';
import { PriceService } from '@perena/price-oracle-adapter';
import { NumeraireService } from '@perena/numeraire-wrapper';
import { WalletService } from '../wallet/wallet.service';

interface StablecoinInfo {
  symbol: string;
  name: string;
  issuer: string;
  collateralRatio: number;
  yieldApy: number;
  totalSupply: number;
  isYieldBearing: boolean;
}

@Injectable()
export class UsdEngineService {
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
    private readonly priceService: PriceService,
    private readonly numeraireService: NumeraireService,
    private readonly walletService: WalletService
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
    // This would typically handle fiat off-ramp integration
    // For now, simulate a withdrawal by burning stablecoins
    
    // Check if user has enough balance
    const balance = await this.walletService.getTokenBalance(walletAddress, stablecoinSymbol);
    if (balance < amount) {
      throw new Error(`Insufficient ${stablecoinSymbol} balance`);
    }
    
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
    // Convert yield-bearing stablecoin back to regular version
    const baseToken = yieldStablecoin.replace('y', '');
    
    // Calculate yield earned
    const yieldInfo = await this.getYieldInfo(walletAddress, yieldStablecoin, amount);
    
    // Execute conversion via Numeraire
    const result = await this.numeraireService.redeemFromYieldBearing({
      walletAddress,
      yieldStablecoin,
      amount
    });

    return {
      txHash: result.txHash,
      baseTokenAmount: amount, // 1:1 conversion ratio for principal
      yieldEarned: yieldInfo.yieldEarned
    };
  }

  async getYieldRate(stablecoinSymbol: string): Promise<number> {
    // This would typically fetch current yield rate from on-chain
    // For now, return static values
    const yieldRates: Record<string, number> = {
      'yUSDC': 4.5,
      'yUSDT': 4.2
    };
    
    return yieldRates[stablecoinSymbol] || 0;
  }

  async getYieldInfo(
    walletAddress: string,
    yieldStablecoin: string,
    amount?: number
  ): Promise<{ principal: number; yieldEarned: number; apy: number }> {
    // Get user's balance if amount not specified
    if (!amount) {
      amount = await this.walletService.getTokenBalance(walletAddress, yieldStablecoin);
    }
    
    // Get current yield rate
    const apy = await this.getYieldRate(yieldStablecoin);
    
    // Calculate yield earned (simplified)
    // In a real implementation, this would calculate based on deposit time
    const yieldEarned = amount * (apy / 100) * (30 / 365); // Assume 30 days of yield
    
    return {
      principal: amount,
      yieldEarned,
      apy
    };
  }

  private async updateYieldRates(): Promise<void> {
    // Update yield rates for all yield-bearing stablecoins
    for (const stablecoin of this.stablecoins) {
      if (stablecoin.isYieldBearing) {
        stablecoin.yieldApy = await this.getYieldRate(stablecoin.symbol);
      }
    }
  }
}
