import { Keypair } from '@solana/web3.js';
import { encrypt } from './encryptWallet';
import { saveWallet } from './walletStore';
import { logger } from '../utils/logger';

export async function generateWallet(userId: string, encryptionKey: string): Promise<string> {
  try {
    // Generate new Solana keypair
    const wallet = Keypair.generate();
    
    // Get the secret key (private key)
    const privateKey = Buffer.from(wallet.secretKey).toString('hex');
    
    // Encrypt the private key
    const encryptedPrivateKey = await encrypt(privateKey, encryptionKey);
    
    // Save encrypted wallet to database
    await saveWallet({
      userId,
      publicKey: wallet.publicKey.toString(),
      encryptedPrivateKey,
      createdAt: new Date()
    });

    return wallet.publicKey.toString();
  } catch (error) {
    logger.error('Failed to generate wallet:', error);
    throw new Error('Wallet generation failed');
  }
}
