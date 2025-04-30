import { logger } from '../utils/logger';

export interface YieldData {
  symbol: string;
  apy: number;
  provider: string;
  lockupPeriod: number; // in days
  minAmount: number;
  maxAmount: number | null;
  tvl: number; // Total Value Locked
  updatedAt: Date;
}

export interface YieldCurvePoint {
  duration: number; // in days
  apy: number;
}

export class YieldCurve {
  // Mock data for yield sources
  private yieldSources: YieldData[] = [
    {
      symbol: 'USDC',
      apy: 4.5,
      provider: 'Perena',
      lockupPeriod: 0,
      minAmount: 1,
      maxAmount: null,
      tvl: 10000000,
      updatedAt: new Date()
    },
    {
      symbol: 'USDC',
      apy: 4.2,
      provider: 'Solend',
      lockupPeriod: 0,
      minAmount: 1,
      maxAmount: null,
      tvl: 50000000,
      updatedAt: new Date()
    },
    {
      symbol: 'USDC',
      apy: 5.1,
      provider: 'Perena',
      lockupPeriod: 30,
      minAmount: 100,
      maxAmount: null,
      tvl: 5000000,
      updatedAt: new Date()
    },
    {
      symbol: 'USDC',
      apy: 5.8,
      provider: 'Perena',
      lockupPeriod: 90,
      minAmount: 1000,
      maxAmount: null,
      tvl: 2000000,
      updatedAt: new Date()
    },
    {
      symbol: 'USDT',
      apy: 4.3,
      provider: 'Perena',
      lockupPeriod: 0,
      minAmount: 1,
      maxAmount: null,
      tvl: 8000000,
      updatedAt: new Date()
    },
    {
      symbol: 'USDT',
      apy: 4.0,
      provider: 'Solend',
      lockupPeriod: 0,
      minAmount: 1,
      maxAmount: null,
      tvl: 40000000,
      updatedAt: new Date()
    }
  ];

  constructor() {
    logger.info('YieldCurve initialized');
  }

  /**
   * Get all yield sources for a specific token
   * @param symbol Token symbol
   * @returns Array of yield sources
   */
  getYieldSources(symbol: string): YieldData[] {
    logger.info('Getting yield sources', { symbol });
    
    // In a real implementation, this would fetch from on-chain or API sources
    return this.yieldSources.filter(source => source.symbol === symbol);
  }

  /**
   * Get the best yield source for a token
   * @param symbol Token symbol
   * @param amount Amount to deposit
   * @param maxLockupPeriod Maximum acceptable lockup period in days
   * @returns Best yield source or null if none found
   */
  getBestYieldSource(
    symbol: string,
    amount: number,
    maxLockupPeriod: number = 0
  ): YieldData | null {
    logger.info('Getting best yield source', { symbol, amount, maxLockupPeriod });
    
    const sources = this.getYieldSources(symbol);
    
    // Filter sources by amount and lockup constraints
    const eligibleSources = sources.filter(source => 
      source.minAmount <= amount &&
      (source.maxAmount === null || source.maxAmount >= amount) &&
      source.lockupPeriod <= maxLockupPeriod
    );
    
    if (eligibleSources.length === 0) {
      return null;
    }
    
    // Sort by APY (highest first)
    eligibleSources.sort((a, b) => b.apy - a.apy);
    
    return eligibleSources[0];
  }

  /**
   * Get yield curve for a token
   * @param symbol Token symbol
   * @returns Yield curve points
   */
  getYieldCurve(symbol: string): YieldCurvePoint[] {
    logger.info('Getting yield curve', { symbol });
    
    const sources = this.getYieldSources(symbol);
    
    // Group by lockup period and find highest APY for each
    const periodMap = new Map<number, number>();
    
    sources.forEach(source => {
      const currentBest = periodMap.get(source.lockupPeriod) || 0;
      if (source.apy > currentBest) {
        periodMap.set(source.lockupPeriod, source.apy);
      }
    });
    
    // Convert to array of points
    const curve = Array.from(periodMap.entries()).map(([duration, apy]) => ({
      duration,
      apy
    }));
    
    // Sort by duration
    curve.sort((a, b) => a.duration - b.duration);
    
    return curve;
  }

  /**
   * Calculate expected yield for a deposit
   * @param symbol Token symbol
   * @param amount Amount to deposit
   * @param durationDays Duration in days
   * @returns Expected yield amount
   */
  calculateExpectedYield(
    symbol: string,
    amount: number,
    durationDays: number
  ): { yieldAmount: number; apy: number } {
    logger.info('Calculating expected yield', { symbol, amount, durationDays });
    
    // Get best yield source for the duration
    const bestSource = this.getBestYieldSource(symbol, amount, durationDays);
    
    if (!bestSource) {
      return { yieldAmount: 0, apy: 0 };
    }
    
    // Calculate yield
    const apy = bestSource.apy;
    const yieldAmount = amount * (apy / 100) * (durationDays / 365);
    
    return { yieldAmount, apy };
  }

  /**
   * Compare yield across different providers
   * @param symbol Token symbol
   * @returns Comparison of providers
   */
  compareProviders(symbol: string): Record<string, number> {
    logger.info('Comparing providers', { symbol });
    
    const sources = this.getYieldSources(symbol);
    
    // Filter for sources with no lockup
    const noLockupSources = sources.filter(source => source.lockupPeriod === 0);
    
    // Group by provider and get APY
    const providerMap: Record<string, number> = {};
    
    noLockupSources.forEach(source => {
      providerMap[source.provider] = source.apy;
    });
    
    return providerMap;
  }

  /**
   * Update yield data (would be called periodically)
   */
  updateYieldData(): void {
    logger.info('Updating yield data');
    
    // In a real implementation, this would fetch fresh data from various sources
    // For now, just update the timestamps
    this.yieldSources.forEach(source => {
      source.updatedAt = new Date();
      
      // Add some random variation to APYs to simulate market changes
      const variation = (Math.random() - 0.5) * 0.2; // +/- 0.1%
      source.apy = Math.max(0, source.apy + variation);
    });
  }
}
