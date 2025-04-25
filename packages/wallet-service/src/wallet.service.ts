import { Injectable } from '@nestjs/common';
import { logger } from '@perena/utils';
import * as walletLib from '../../../libs/wallet-service';

@Injectable()
export class WalletService {
  /**
   * Generate a new wallet for a user
   * @param userId User ID
   * @param encryptionKey Encryption key for securing the private key
   * @returns Wallet information
   */
  async generateWallet(userId: string, encryptionKey: string): Promise<{
    walletAddress: string;
    encryptedPrivateKey: string;
  }> {
    logger.info('Generating wallet', { userId });
    
    try {
      // Use the libs implementation
      return await walletLib.createAndSetupWallet(userId, encryptionKey);
    } catch (error) {
      logger.error('Error generating wallet', error);
      throw new Error(`Failed to generate wallet: ${error.message}`);
    }
  }
  
  /**
   * Get wallet balance
   * @param walletAddress Wallet address
   * @returns Wallet balance information
   */
  async getWalletBalance(walletAddress: string): Promise<{
    sol: number;
    tokens: Array<{ symbol: string; balance: number; usdValue: number }>;
  }> {
    logger.info('Getting wallet balance', { walletAddress });
    
    try {
      // Use the libs implementation
      const solBalance = await walletLib.getSolBalance(walletAddress);
      const tokenBalances = await walletLib.getTokenBalances(walletAddress);
      
      return {
        sol: solBalance,
        tokens: tokenBalances.map(token => ({
          symbol: token.symbol,
          balance: token.amount,
          usdValue: token.usdValue || 0
        }))
      };
    } catch (error) {
      logger.error('Error getting wallet balance', error);
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }
  
  /**
   * Create a new Solana account
   * @param fromPrivateKey Encrypted private key of the funding account
   * @param encryptionKey Key to decrypt the private key
   * @param space Amount of space to reserve for the account
   * @param lamports Amount of lamports to fund the account with
   * @returns New account information
   */
  async createAccount(
    fromPrivateKey: string,
    encryptionKey: string,
    space: number = 0,
    lamports?: number
  ): Promise<{
    publicKey: string;
    privateKey: string;
    signature: string;
  }> {
    logger.info('Creating Solana account', { space });
    
    try {
      // Use the libs implementation
      return await walletLib.createAccount(
        fromPrivateKey,
        encryptionKey,
        space,
        lamports
      );
    } catch (error) {
      logger.error('Error creating account', error);
      throw new Error(`Failed to create account: ${error.message}`);
    }
  }
  
  /**
   * Request an airdrop of SOL (for development/testing)
   * @param publicKey Public key to receive the airdrop
   * @param amount Amount of SOL to airdrop
   * @returns Airdrop transaction signature
   */
  async requestAirdrop(
    publicKey: string,
    amount: number = 1
  ): Promise<string> {
    logger.info('Requesting SOL airdrop', { publicKey, amount });
    
    try {
      // Use the libs implementation
      return await walletLib.requestAirdrop(publicKey, amount, 'devnet');
    } catch (error) {
      logger.error('Error requesting airdrop', error);
      throw new Error(`Failed to request airdrop: ${error.message}`);
    }
  }
  
  /**
   * Transfer SOL between wallets
   * @param fromPrivateKey Encrypted private key of sender
   * @param toAddress Recipient wallet address
   * @param amount Amount to send in SOL
   * @param encryptionKey Key to decrypt the private key
   * @returns Transaction signature
   */
  async transferSol(
    fromPrivateKey: string,
    toAddress: string,
    amount: number,
    encryptionKey: string
  ): Promise<string> {
    logger.info('Transferring SOL', { toAddress, amount });
    
    try {
      // Use the libs implementation
      return await walletLib.transferSol(
        fromPrivateKey,
        toAddress,
        amount,
        encryptionKey
      );
    } catch (error) {
      logger.error('Error transferring SOL', error);
      throw new Error(`Failed to transfer SOL: ${error.message}`);
    }
  }
  
  /**
   * Get transaction history for a wallet
   * @param walletAddress Wallet address
   * @param limit Maximum number of transactions to return
   * @returns Array of transaction information
   */
  async getTransactionHistory(
    walletAddress: string,
    limit: number = 10
  ): Promise<any[]> {
    logger.info('Getting transaction history', { walletAddress, limit });
    
    try {
      // Use the libs implementation
      return await walletLib.getTransactionHistory(walletAddress, limit);
    } catch (error) {
      logger.error('Error getting transaction history', error);
      throw new Error(`Failed to get transaction history: ${error.message}`);
    }
  }
}
