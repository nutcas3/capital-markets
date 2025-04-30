import { Injectable } from '@nestjs/common';
import { TradeService } from '../trade/trade.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthService } from '../auth/auth.service';
import { formatCurrency } from '@perena/utils';

interface WhatsAppMessage {
  from: string;
  text: {
    body: string;
  };
}

@Injectable()
export class BotService {
  constructor(
    private readonly tradeService: TradeService,
    private readonly portfolioService: PortfolioService,
    private readonly walletService: WalletService,
    private readonly authService: AuthService
  ) {}

  async processMessage(message: WhatsAppMessage): Promise<string> {
    const session = await this.authService.getOrCreateSession(message.from);

    if (!session.isVerified && message.text.body.toLowerCase() !== 'start') {
      return this.getVerificationMessage();
    }

    const command = message.text.body.toLowerCase().trim();
    
    try {
      switch (true) {
        case command.startsWith('swap '):
          return await this.handleSwapCommand(command, session);
        case command === 'portfolio':
          return await this.handlePortfolioCommand(session);
        case command === 'start':
          return await this.handleStartCommand(session);
        case command === 'help':
          return this.getHelpMessage();
        default:
          return 'Unknown command. Type "help" to see available commands.';
      }
    } catch (error) {
      console.error('Error processing command:', error);
      return 'Sorry, there was an error processing your request. Please try again.';
    }
  }

  private async handleSwapCommand(command: string, session: any): Promise<string> {
    const parts = command.split(' ');
    if (parts.length !== 5 || parts[3] !== 'to') {
      return 'Invalid swap format. Use: swap [amount] [from_token] to [to_token]';
    }

    const [_, amount, fromToken, __, toToken] = parts;
    
    try {
      const quote = await this.tradeService.getQuote(fromToken, toToken, parseFloat(amount));
      const result = await this.tradeService.executeSwap(session.walletAddress, quote);
      
      return `✅ Swap completed!\nAmount: ${formatCurrency(amount)} ${fromToken}\nReceived: ${formatCurrency(result.receivedAmount)} ${toToken}`;
    } catch (error) {
      console.error('Swap error:', error);
      return 'Failed to execute swap. Please try again later.';
    }
  }

  private async handlePortfolioCommand(session: any): Promise<string> {
    try {
      const portfolio = await this.portfolioService.getPortfolio(session.walletAddress);
      
      let response = '📊 Your Portfolio:\n\n';
      for (const asset of portfolio.assets) {
        response += `${asset.symbol}: ${formatCurrency(asset.balance)} ($${formatCurrency(asset.usdValue)})\n`;
      }
      response += `\nTotal Value: $${formatCurrency(portfolio.totalValue)}`;
      
      return response;
    } catch (error) {
      console.error('Portfolio error:', error);
      return 'Failed to fetch portfolio. Please try again later.';
    }
  }

  private async handleStartCommand(session: any): Promise<string> {
    if (!session.walletAddress) {
      const wallet = await this.walletService.createWallet(session.userId);
      return `Welcome! Your wallet has been created.\nAddress: ${wallet.address}\n\nType "help" to see available commands.`;
    }
    return 'Welcome back! Type "help" to see available commands.';
  }

  private getHelpMessage(): string {
    return `🤖 Available Commands:
• swap [amount] [from_token] to [to_token]
• portfolio - View your holdings
• help - Show this message`;
  }

  getVerificationMessage(): string {
    return 'Please verify your phone number to start trading. Reply with "start" to begin.';
  }
}
