import { Injectable } from '@nestjs/common';
import { TradeService } from '../../trade/trade.service';
import { formatCurrency } from '@perena/utils';

@Injectable()
export class SwapCommand {
  constructor(private readonly tradeService: TradeService) {}

  async execute(params: string[], session: any): Promise<string> {
    if (params.length !== 4 || params[2] !== 'to') {
      return 'Invalid swap format. Use: swap [amount] [from_token] to [to_token]';
    }

    const [amount, fromToken, _, toToken] = params;
    
    try {
      const quote = await this.tradeService.getQuote(fromToken, toToken, parseFloat(amount));
      const result = await this.tradeService.executeSwap(session.walletAddress, quote);
      
      return `✅ Swap completed!\nAmount: ${formatCurrency(amount)} ${fromToken}\nReceived: ${formatCurrency(result.receivedAmount)} ${toToken}`;
    } catch (error) {
      console.error('Swap error:', error);
      return 'Failed to execute swap. Please try again later.';
    }
  }
}
