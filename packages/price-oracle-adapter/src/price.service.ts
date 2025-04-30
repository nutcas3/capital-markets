import { logger } from '@perena/utils';
import { Connection } from '@solana/web3.js';

interface PriceData {
  value: number;
  timestamp: Date;
  change24h: number;
  source: string;
}

export class PriceService {
  private connection: Connection;
  private priceCache: Map<string, PriceData> = new Map();
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute cache
  
  constructor(
    rpcUrl: string = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
  ) {
    this.connection = new Connection(rpcUrl, 'confirmed');
    logger.info('PriceService initialized', { rpcUrl });
  }
  
  /**
   * Get price for a given asset pair
   * @param pairId Asset pair ID (e.g., 'USDC/USD', 'xGOLD/USD')
   * @returns Price data
   */
  async getPrice(pairId: string): Promise<PriceData> {
    // Check cache first
    const cachedPrice = this.priceCache.get(pairId);
    const now = Date.now();
    
    if (cachedPrice && (now - cachedPrice.timestamp.getTime()) < this.CACHE_TTL_MS) {
      return cachedPrice;
    }
    
    // In a real implementation, this would fetch from Pyth or Switchboard
    // For now, return mock data
    const priceData = this.getMockPrice(pairId);
    
    // Update cache
    this.priceCache.set(pairId, priceData);
    
    return priceData;
  }
  
  /**
   * Get historical price data
   * @param pairId Asset pair ID
   * @param days Number of days of history
   * @returns Array of price data points
   */
  async getPriceHistory(pairId: string, days: number = 30): Promise<PriceData[]> {
    logger.info('Getting price history', { pairId, days });
    
    // In a real implementation, this would fetch historical data
    // For now, return mock data
    const history: PriceData[] = [];
    const currentPrice = await this.getPrice(pairId);
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = days; i >= 0; i--) {
      // Generate some random price movement
      const randomChange = (Math.random() - 0.5) * 0.02; // +/- 1%
      const dayFactor = 1 + (randomChange * (days - i));
      
      history.push({
        value: currentPrice.value * dayFactor,
        timestamp: new Date(now - (i * dayMs)),
        change24h: (Math.random() - 0.5) * 0.02, // +/- 1%
        source: 'mock'
      });
    }
    
    return history;
  }
  
  /**
   * Generate mock price data for testing
   * @param pairId Asset pair ID
   * @returns Mock price data
   */
  private getMockPrice(pairId: string): PriceData {
    // Mock prices for common pairs
    const mockPrices: Record<string, number> = {
      'USDC/USD': 1.0,
      'USDT/USD': 1.0,
      'xKES/USD': 0.0066,
      'xGOLD/USD': 2000.0,
      'xEUR/USD': 1.09,
      'KES/USD': 0.0066,
      'GOLD/USD': 2000.0,
      'EUR/USD': 1.09,
      'USD/KES': 150.0,
      'USD/EUR': 0.92
    };
    
    // If pair not found, generate a price
    const price = mockPrices[pairId] || Math.random() * 100;
    
    // Generate a random 24h change (-2% to +2%)
    const change24h = (Math.random() - 0.5) * 0.04;
    
    return {
      value: price,
      timestamp: new Date(),
      change24h,
      source: 'mock'
    };
  }
}
