import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateWallet, encrypt } from '@perena/wallet-service';
import { config } from '../config/config';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async createWallet(userId: string) {
    // Check if wallet already exists
    const existingWallet = await this.prisma.wallet.findUnique({
      where: { userId }
    });

    if (existingWallet) {
      throw new Error('Wallet already exists for this user');
    }

    // Generate new wallet
    const walletAddress = await generateWallet(userId, config.encryption.key);

    // Update user with wallet address
    await this.prisma.user.update({
      where: { id: userId },
      data: { walletAddress }
    });

    return { address: walletAddress };
  }

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return {
      address: wallet.publicKey,
      isVerified: wallet.user.isVerified
    };
  }

  async listUserTokens(walletAddress: string) {
    // This would typically call the Solana RPC to get token accounts
    // For now, returning a mock response
    return [
      { symbol: 'USDC', balance: '1000.00' },
      { symbol: 'xKES', balance: '5000.00' },
      { symbol: 'xGOLD', balance: '0.5' }
    ];
  }

  async getTokenBalance(walletAddress: string, tokenSymbol: string) {
    const tokens = await this.listUserTokens(walletAddress);
    const token = tokens.find(t => t.symbol === tokenSymbol);
    return token ? parseFloat(token.balance) : 0;
  }
}
