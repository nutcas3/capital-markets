import { logger } from '../utils/logger';

export interface PortfolioAsset {
  symbol: string;
  balance: number;
  usdValue: number;
}

export interface RiskMetrics {
  totalValue: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  valueAtRisk: number;
  riskExposure: Record<string, number>;
}

export class ExposureCalculator {
  // Historical volatility data (annualized) - in a real implementation, this would be fetched from a data source
  private assetVolatility: Record<string, number> = {
    'USDC': 0.01, // 1% - very low volatility for stablecoins
    'USDT': 0.01,
    'yUSDC': 0.01,
    'xGOLD': 0.15, // 15% - moderate volatility for gold
    'xKES': 0.08, // 8% - moderate volatility for currency
    'xEUR': 0.06 // 6% - lower volatility for major currency
  };

  // Asset correlation matrix - in a real implementation, this would be calculated from historical data
  private correlationMatrix: Record<string, Record<string, number>> = {
    'USDC': { 'USDC': 1.0, 'USDT': 0.95, 'yUSDC': 0.99, 'xGOLD': 0.1, 'xKES': 0.2, 'xEUR': 0.3 },
    'USDT': { 'USDC': 0.95, 'USDT': 1.0, 'yUSDC': 0.95, 'xGOLD': 0.1, 'xKES': 0.2, 'xEUR': 0.3 },
    'yUSDC': { 'USDC': 0.99, 'USDT': 0.95, 'yUSDC': 1.0, 'xGOLD': 0.1, 'xKES': 0.2, 'xEUR': 0.3 },
    'xGOLD': { 'USDC': 0.1, 'USDT': 0.1, 'yUSDC': 0.1, 'xGOLD': 1.0, 'xKES': 0.4, 'xEUR': 0.5 },
    'xKES': { 'USDC': 0.2, 'USDT': 0.2, 'yUSDC': 0.2, 'xGOLD': 0.4, 'xKES': 1.0, 'xEUR': 0.6 },
    'xEUR': { 'USDC': 0.3, 'USDT': 0.3, 'yUSDC': 0.3, 'xGOLD': 0.5, 'xKES': 0.6, 'xEUR': 1.0 }
  };

  constructor() {
    logger.info('ExposureCalculator initialized');
  }

  /**
   * Calculate risk metrics for a portfolio
   * @param portfolio Array of assets in the portfolio
   * @returns Risk metrics
   */
  calculateRiskMetrics(portfolio: PortfolioAsset[]): RiskMetrics {
    logger.info('Calculating risk metrics', { portfolioSize: portfolio.length });
    
    // Calculate total portfolio value
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.usdValue, 0);
    
    if (totalValue === 0) {
      return this.getEmptyRiskMetrics();
    }
    
    // Calculate portfolio weights
    const weights: Record<string, number> = {};
    portfolio.forEach(asset => {
      weights[asset.symbol] = asset.usdValue / totalValue;
    });
    
    // Calculate portfolio volatility using weights, individual volatilities, and correlation matrix
    const volatility = this.calculatePortfolioVolatility(weights);
    
    // Calculate Sharpe ratio (assuming risk-free rate of 2%)
    const riskFreeRate = 0.02;
    const expectedReturn = this.calculateExpectedReturn(weights);
    const sharpeRatio = (expectedReturn - riskFreeRate) / volatility;
    
    // Calculate Value at Risk (VaR) at 95% confidence level
    // Using parametric VaR formula: VaR = Z * σ * √T * P
    // where Z is the Z-score for the confidence level, σ is volatility, T is time horizon (1 day), P is portfolio value
    const zScore95 = 1.645; // Z-score for 95% confidence level
    const valueAtRisk = zScore95 * volatility * Math.sqrt(1/252) * totalValue;
    
    // Calculate maximum drawdown (simplified - in a real implementation, this would use historical data)
    const maxDrawdown = volatility * 2.5; // Simplified approximation
    
    // Calculate risk exposure by asset class
    const riskExposure = this.calculateRiskExposure(portfolio, weights, volatility);
    
    return {
      totalValue,
      volatility,
      sharpeRatio,
      maxDrawdown,
      valueAtRisk,
      riskExposure
    };
  }

  /**
   * Calculate slippage for a trade
   * @param fromToken Source token
   * @param toToken Destination token
   * @param amount Amount to trade
   * @returns Estimated slippage percentage
   */
  calculateSlippage(fromToken: string, toToken: string, amount: number): number {
    logger.info('Calculating slippage', { fromToken, toToken, amount });
    
    // In a real implementation, this would calculate slippage based on liquidity depth
    // For now, use a simple model based on amount and asset volatility
    
    // Get asset volatilities
    const fromVolatility = this.assetVolatility[fromToken] || 0.05;
    const toVolatility = this.assetVolatility[toToken] || 0.05;
    
    // Calculate base slippage based on average volatility
    const avgVolatility = (fromVolatility + toVolatility) / 2;
    
    // Slippage increases with amount (simplified model)
    // Assuming $10,000 as a reference point for 0.5% slippage
    const amountFactor = Math.sqrt(amount / 10000);
    
    // Calculate slippage
    const slippage = avgVolatility * 0.1 * amountFactor;
    
    // Cap slippage at reasonable bounds
    return Math.min(Math.max(slippage, 0.001), 0.05);
  }

  /**
   * Calculate optimal slippage tolerance for a trade
   * @param fromToken Source token
   * @param toToken Destination token
   * @param amount Amount to trade
   * @returns Recommended slippage tolerance
   */
  calculateSlippageTolerance(fromToken: string, toToken: string, amount: number): number {
    logger.info('Calculating slippage tolerance', { fromToken, toToken, amount });
    
    // Get estimated slippage
    const estimatedSlippage = this.calculateSlippage(fromToken, toToken, amount);
    
    // Add a buffer for safety (1.5x the estimated slippage)
    return estimatedSlippage * 1.5;
  }

  /**
   * Calculate risk exposure by asset
   */
  private calculateRiskExposure(
    portfolio: PortfolioAsset[],
    weights: Record<string, number>,
    portfolioVolatility: number
  ): Record<string, number> {
    const riskExposure: Record<string, number> = {};
    
    portfolio.forEach(asset => {
      const assetVolatility = this.assetVolatility[asset.symbol] || 0.05;
      const weight = weights[asset.symbol];
      
      // Calculate marginal contribution to risk
      let marginalContribution = weight * assetVolatility;
      
      // Adjust for correlations with other assets
      portfolio.forEach(otherAsset => {
        if (otherAsset.symbol !== asset.symbol) {
          const correlation = this.getCorrelation(asset.symbol, otherAsset.symbol);
          const otherWeight = weights[otherAsset.symbol];
          const otherVolatility = this.assetVolatility[otherAsset.symbol] || 0.05;
          
          marginalContribution += weight * otherWeight * correlation * assetVolatility * otherVolatility;
        }
      });
      
      // Calculate percentage contribution to portfolio risk
      riskExposure[asset.symbol] = (marginalContribution / portfolioVolatility) * 100;
    });
    
    return riskExposure;
  }

  /**
   * Calculate portfolio volatility
   */
  private calculatePortfolioVolatility(weights: Record<string, number>): number {
    let variance = 0;
    
    // Calculate weighted variance including correlations
    const assets = Object.keys(weights);
    
    for (let i = 0; i < assets.length; i++) {
      const assetI = assets[i];
      const weightI = weights[assetI];
      const volatilityI = this.assetVolatility[assetI] || 0.05;
      
      // Add individual asset variance
      variance += weightI * weightI * volatilityI * volatilityI;
      
      // Add covariance terms
      for (let j = i + 1; j < assets.length; j++) {
        const assetJ = assets[j];
        const weightJ = weights[assetJ];
        const volatilityJ = this.assetVolatility[assetJ] || 0.05;
        const correlation = this.getCorrelation(assetI, assetJ);
        
        variance += 2 * weightI * weightJ * volatilityI * volatilityJ * correlation;
      }
    }
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate expected return based on weights
   */
  private calculateExpectedReturn(weights: Record<string, number>): number {
    // In a real implementation, this would use historical returns or forecasts
    // For now, use simplified expected returns
    const expectedReturns: Record<string, number> = {
      'USDC': 0.01, // 1% for stablecoins
      'USDT': 0.01,
      'yUSDC': 0.045, // 4.5% for yield-bearing stablecoins
      'xGOLD': 0.07, // 7% for gold
      'xKES': 0.06, // 6% for emerging market currency
      'xEUR': 0.03 // 3% for major currency
    };
    
    let portfolioReturn = 0;
    Object.entries(weights).forEach(([asset, weight]) => {
      portfolioReturn += weight * (expectedReturns[asset] || 0.03);
    });
    
    return portfolioReturn;
  }

  /**
   * Get correlation between two assets
   */
  private getCorrelation(assetA: string, assetB: string): number {
    return (this.correlationMatrix[assetA]?.[assetB]) || 
           (this.correlationMatrix[assetB]?.[assetA]) || 
           0.5; // Default correlation if not found
  }

  /**
   * Get empty risk metrics for empty portfolio
   */
  private getEmptyRiskMetrics(): RiskMetrics {
    return {
      totalValue: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      valueAtRisk: 0,
      riskExposure: {}
    };
  }
}
