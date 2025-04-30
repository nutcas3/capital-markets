import { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { decryptPrivateKey } from './encryptWallet';

interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  decimals: number;
  usdValue?: number;
}

/**
 * Get SOL balance for a wallet
 * @param walletAddress Wallet address
 * @param rpcUrl Solana RPC URL
 * @returns SOL balance in SOL units
 */
export async function getSolBalance(
  walletAddress: string,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<number> {
  logger.info('Getting SOL balance', { walletAddress });
  
  try {
    // Connect to Solana
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Get balance
    const publicKey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(publicKey);
    
    // Convert from lamports to SOL
    const solBalance = balance / LAMPORTS_PER_SOL;
    
    logger.info('SOL balance retrieved', { walletAddress, solBalance });
    
    return solBalance;
  } catch (error) {
    logger.error('Error getting SOL balance', error);
    throw new Error(`Failed to get SOL balance: ${error.message}`);
  }
}

/**
 * Get token balances for a wallet
 * @param walletAddress Wallet address
 * @param rpcUrl Solana RPC URL
 * @returns Array of token balances
 */
export async function getTokenBalances(
  walletAddress: string,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<TokenBalance[]> {
  logger.info('Getting token balances', { walletAddress });
  
  try {
    // In a real implementation, this would use the Solana SPL Token program
    // For now, return mock data
    
    // Mock token balances
    const mockBalances: TokenBalance[] = [
      {
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        amount: 1000.0,
        decimals: 6,
        usdValue: 1000.0
      },
      {
        mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        amount: 500.0,
        decimals: 6,
        usdValue: 500.0
      },
      {
        mint: 'usd1234567890abcdef',
        symbol: 'USD*',
        amount: 750.0,
        decimals: 6,
        usdValue: 750.75 // Slight premium
      }
    ];
    
    logger.info('Token balances retrieved', { walletAddress, tokenCount: mockBalances.length });
    
    return mockBalances;
  } catch (error) {
    logger.error('Error getting token balances', error);
    throw new Error(`Failed to get token balances: ${error.message}`);
  }
}

/**
 * Transfer SOL from one wallet to another
 * @param fromPrivateKey Encrypted private key of sender
 * @param toAddress Recipient wallet address
 * @param amount Amount to send in SOL
 * @param encryptionKey Key to decrypt the private key
 * @param rpcUrl Solana RPC URL
 * @returns Transaction signature
 */
export async function transferSol(
  fromPrivateKey: string,
  toAddress: string,
  amount: number,
  encryptionKey: string,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<string> {
  logger.info('Transferring SOL', { toAddress, amount });
  
  try {
    // Decrypt the private key
    const decryptedPrivateKey = await decryptPrivateKey(fromPrivateKey, encryptionKey);
    
    // Create a keypair from the private key
    const privateKeyBytes = Buffer.from(decryptedPrivateKey, 'hex');
    const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);
    
    // Connect to Solana
    const connection = new Connection(rpcUrl, 'confirmed');
    
    // Create a transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: new PublicKey(toAddress),
        lamports: amount * LAMPORTS_PER_SOL
      })
    );
    
    // Set recent blockhash
    transaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.feePayer = fromKeypair.publicKey;
    
    // Sign and send the transaction
    // In a real implementation, this would actually send the transaction
    // For now, return a mock signature
    const signature = `mock_signature_${Math.random().toString(36).substring(2, 15)}`;
    
    logger.info('SOL transferred', { toAddress, amount, signature });
    
    return signature;
  } catch (error) {
    logger.error('Error transferring SOL', error);
    throw new Error(`Failed to transfer SOL: ${error.message}`);
  }
}

/**
 * Get transaction history for a wallet
 * @param walletAddress Wallet address
 * @param limit Maximum number of transactions to return
 * @param rpcUrl Solana RPC URL
 * @returns Array of transaction information
 */
export async function getTransactionHistory(
  walletAddress: string,
  limit: number = 10,
  rpcUrl: string = 'https://api.mainnet-beta.solana.com'
): Promise<any[]> {
  logger.info('Getting transaction history', { walletAddress, limit });
  
  try {
    // In a real implementation, this would fetch transactions from Solana
    // For now, return mock data
    
    // Mock transaction history
    const mockTransactions = Array(limit).fill(0).map((_, i) => ({
      signature: `mock_signature_${i}_${Math.random().toString(36).substring(2, 10)}`,
      blockTime: Date.now() / 1000 - i * 3600, // 1 hour apart
      slot: 150000000 - i * 1000,
      err: null,
      fee: 5000,
      status: 'confirmed'
    }));
    
    logger.info('Transaction history retrieved', { walletAddress, count: mockTransactions.length });
    
    return mockTransactions;
  } catch (error) {
    logger.error('Error getting transaction history', error);
    throw new Error(`Failed to get transaction history: ${error.message}`);
  }
}
