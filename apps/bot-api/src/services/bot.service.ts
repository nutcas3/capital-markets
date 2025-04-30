import { TradeService } from './trade.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { logger } from '../../../libs/utils/logger';
import { formatCurrency } from '../../../libs/utils/formatter';

interface WhatsAppMessage {
  from: string;
  text: {
    body: string;
  };
}

interface UserSession {
  id: string;
  isVerified: boolean;
  phoneNumber: string;
  walletAddress?: string;
}

export class BotService {
  private tradeService: TradeService;
  private portfolioService: PortfolioService;

  constructor() {
    this.tradeService = new TradeService();
    this.portfolioService = new PortfolioService();
  }

  async processMessage(message: WhatsAppMessage, session: UserSession): Promise<string> {
    const command = message.text.body.toLowerCase().trim();

    try {
      // Parse command and route to appropriate service
      if (command.startsWith('swap ')) {
        return await this.handleSwapCommand(command, session);
      } else if (command === 'portfolio') {
        return await this.handlePortfolioCommand(session);
      } else if (command === 'help') {
        return this.getHelpMessage();
      }

      return 'Unknown command. Type "help" to see available commands.';
    } catch (error) {
      logger.error('Error processing command:', error);
      return 'Sorry, there was an error processing your request. Please try again.';
    }
  }

  private async handleSwapCommand(command: string, session: UserSession): Promise<string> {
    // Example: "swap 100 USDC to xKES"
    const parts = command.split(' ');
    if (parts.length !== 5 || parts[3] !== 'to') {
      return 'Invalid swap format. Use: swap [amount] [from_token] to [to_token]';
    }

    const [_, amount, fromToken, __, toToken] = parts;
    
    try {
      const quote = await this.tradeService.getQuote(fromToken, toToken, parseFloat(amount));
      const result = await this.tradeService.executeSwap(session.walletAddress!, quote);
      
      return `✅ Swap completed!\nAmount: ${formatCurrency(amount)} ${fromToken}\nReceived: ${formatCurrency(result.receivedAmount)} ${toToken}`;
    } catch (error) {
      logger.error('Swap error:', error);
      return 'Failed to execute swap. Please try again later.';
    }
  }

  private async handlePortfolioCommand(session: UserSession): Promise<string> {
    try {
      const portfolio = await this.portfolioService.getPortfolio(session.walletAddress!);
      
      let response = '📊 Your Portfolio:\n\n';
      for (const asset of portfolio.assets) {
        response += `${asset.symbol}: ${formatCurrency(asset.balance)} ($${formatCurrency(asset.usdValue)})\n`;
      }
      response += `\nTotal Value: $${formatCurrency(portfolio.totalValue)}`;
      
      return response;
    } catch (error) {
      logger.error('Portfolio error:', error);
      return 'Failed to fetch portfolio. Please try again later.';
    }
  }

  private getHelpMessage(): string {
    return `🤖 Available Commands:
• swap [amount] [from_token] to [to_token]
• portfolio - View your holdings
• help - Show this message`;
  }

  async sendMessage(to: string, message: string): Promise<void> {
    // Implementation to send message via WhatsApp Business API
    // This would typically use the WhatsApp Cloud API client
  }

  async sendVerificationMessage(to: string): Promise<void> {
    const message = 'Please verify your phone number to start trading. Reply with "start" to begin.';
    await this.sendMessage(to, message);
  }
}
