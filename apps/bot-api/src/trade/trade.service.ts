import { Injectable } from '@nestjs/common';
import { NumeraireService } from '@perena/numeraire-wrapper';
import { PriceService } from '@perena/price-oracle-adapter';
import { NotificationService } from '@perena/notification-service';
import { BotGateway } from '../bot/bot.gateway';

interface Quote {
  fromToken: string;
  toToken: string;
  fromAmount: number;
  expectedToAmount: number;
  minToAmount: number;
  price: number;
  priceImpact: number;
  route: string[];
}

interface SwapResult {
  txHash: string;
  fromAmount: number;
  receivedAmount: number;
  price: number;
}

@Injectable()
export class TradeService {
  constructor(
    private readonly numeraire: NumeraireService,
    private readonly priceService: PriceService,
    private readonly notificationService: NotificationService,
    private readonly botGateway: BotGateway
  ) {}

  async getQuote(fromToken: string, toToken: string, amount: number): Promise<Quote> {
    // Get current price from oracle
    const price = await this.priceService.getPrice(`${fromToken}/${toToken}`);
    
    // Get quote from Numeraire AMM
    const quote = await this.numeraire.getQuote({
      fromToken,
      toToken,
      fromAmount: amount,
      slippageTolerance: 0.005 // 0.5%
    });

    return {
      fromToken,
      toToken,
      fromAmount: amount,
      expectedToAmount: quote.expectedAmount,
      minToAmount: quote.minimumAmount,
      price: price.value,
      priceImpact: quote.priceImpact,
      route: quote.route
    };
  }

  async executeSwap(walletAddress: string, quote: Quote): Promise<SwapResult> {
    // Execute swap through Numeraire
    const result = await this.numeraire.executeSwap({
      walletAddress,
      fromToken: quote.fromToken,
      toToken: quote.toToken,
      fromAmount: quote.fromAmount,
      minToAmount: quote.minToAmount
    });

    // Send notification
    await this.notificationService.sendTradeNotification({
      walletAddress,
      type: 'SWAP_EXECUTED',
      data: {
        txHash: result.txHash,
        fromToken: quote.fromToken,
        toToken: quote.toToken,
        fromAmount: quote.fromAmount,
        receivedAmount: result.receivedAmount
      }
    });

    // Send real-time update via WebSocket
    await this.botGateway.sendTradeNotification(walletAddress, {
      type: 'SWAP_EXECUTED',
      data: result
    });

    return {
      txHash: result.txHash,
      fromAmount: quote.fromAmount,
      receivedAmount: result.receivedAmount,
      price: quote.price
    };
  }
}
