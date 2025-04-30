import { Injectable } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { PriceService } from '@perena/price-oracle-adapter';

interface PortfolioAsset {
  symbol: string;
  balance: number;
  usdValue: number;
  price: number;
  change24h: number;
}

interface Portfolio {
  assets: PortfolioAsset[];
  totalValue: number;
  change24h: number;
}

@Injectable()
export class PortfolioService {
  constructor(
    private readonly walletService: WalletService,
    private readonly priceService: PriceService
  ) {}

  async getPortfolio(walletAddress: string): Promise<Portfolio> {
    // Get all token balances
    const tokens = await this.walletService.listUserTokens(walletAddress);
    
    // Get prices and calculate values
    const assets = await Promise.all(
      tokens.map(async token => {
        const priceData = await this.priceService.getPrice(`${token.symbol}/USD`);
        const balance = parseFloat(token.balance);
        
        return {
          symbol: token.symbol,
          balance,
          price: priceData.value,
          usdValue: balance * priceData.value,
          change24h: priceData.change24h
        };
      })
    );

    // Calculate portfolio totals
    const totalValue = assets.reduce((sum, asset) => sum + asset.usdValue, 0);
    const weightedChange = assets.reduce((sum, asset) => {
      const weight = asset.usdValue / totalValue;
      return sum + (asset.change24h * weight);
    }, 0);

    return {
      assets,
      totalValue,
      change24h: weightedChange
    };
  }

  async getAssetAllocation(walletAddress: string): Promise<{ [key: string]: number }> {
    const portfolio = await this.getPortfolio(walletAddress);
    const allocation: { [key: string]: number } = {};

    portfolio.assets.forEach(asset => {
      allocation[asset.symbol] = (asset.usdValue / portfolio.totalValue) * 100;
    });

    return allocation;
  }

  async getPortfolioHistory(walletAddress: string, days: number = 30) {
    // This would typically fetch historical portfolio values from a time-series database
    // For now, returning mock data
    const history = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    for (let i = days; i >= 0; i--) {
      history.push({
        timestamp: new Date(now - (i * dayMs)),
        value: 1000 + Math.random() * 100 // Mock value
      });
    }

    return history;
  }
}
