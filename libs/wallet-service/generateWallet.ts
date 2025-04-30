import { Keypair } from '@solana/web3.js';
import { logger } from '../utils/logger';
import { encryptPrivateKey } from './encryptWallet';

/**
 * Generate a new Solana wallet
 * @param userId User ID to associate with the wallet
 * @param encryptionKey Encryption key for securing the private key
 * @returns Wallet address (public key)
 */
export async function generateWallet(userId: string, encryptionKey: string): Promise<string> {
  logger.info('Generating wallet', { userId });
  
  try {
    // Generate a new Solana keypair
    const keypair = Keypair.generate();
    
    // Get the public key (wallet address)
    const publicKey = keypair.publicKey.toString();
    
    // Get the private key and convert to string format
    const privateKey = Buffer.from(keypair.secretKey).toString('hex');
    
    // Encrypt the private key
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, encryptionKey);
    
    // In a real implementation, store the wallet info in a database
    // For now, log the information (in production, never log private keys!)
    logger.info('Wallet generated', { 
      userId, 
      publicKey,
      encryptedPrivateKey: `${encryptedPrivateKey.substring(0, 10)}...` // Only log a portion for security
    });
    
    return publicKey;
  } catch (error) {
    logger.error('Error generating wallet', error);
    throw new Error(`Failed to generate wallet: ${error.message}`);
  }
}

/**
 * Import an existing wallet from a private key
 * @param privateKeyHex Private key in hex format
 * @param userId User ID to associate with the wallet
 * @param encryptionKey Encryption key for securing the private key
 * @returns Wallet address (public key)
 */
export async function importWalletFromPrivateKey(
  privateKeyHex: string,
  userId: string,
  encryptionKey: string
): Promise<string> {
  logger.info('Importing wallet from private key', { userId });
  
  try {
    // Convert hex private key to Uint8Array
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    
    // Create keypair from private key
    const keypair = Keypair.fromSecretKey(privateKeyBytes);
    
    // Get the public key (wallet address)
    const publicKey = keypair.publicKey.toString();
    
    // Encrypt the private key
    const encryptedPrivateKey = await encryptPrivateKey(privateKeyHex, encryptionKey);
    
    // In a real implementation, store the wallet info in a database
    // For now, log the information (in production, never log private keys!)
    logger.info('Wallet imported', { 
      userId, 
      publicKey,
      encryptedPrivateKey: `${encryptedPrivateKey.substring(0, 10)}...` // Only log a portion for security
    });
    
    return publicKey;
  } catch (error) {
    logger.error('Error importing wallet', error);
    throw new Error(`Failed to import wallet: ${error.message}`);
  }
}

/**
 * Generate a deterministic wallet from a seed phrase
 * @param seedPhrase Seed phrase (mnemonic)
 * @param userId User ID to associate with the wallet
 * @param encryptionKey Encryption key for securing the private key
 * @returns Wallet address (public key)
 */
export async function generateWalletFromSeedPhrase(
  seedPhrase: string,
  userId: string,
  encryptionKey: string
): Promise<string> {
  logger.info('Generating wallet from seed phrase', { userId });
  
  try {
    // In a real implementation, this would use bip39 and ed25519-hd-key to derive the keypair
    // For now, use a simplified approach (not secure for production)
    
    // Mock implementation
    const mockKeypair = Keypair.generate();
    const publicKey = mockKeypair.publicKey.toString();
    const privateKey = Buffer.from(mockKeypair.secretKey).toString('hex');
    
    // Encrypt the private key
    const encryptedPrivateKey = await encryptPrivateKey(privateKey, encryptionKey);
    
    // In a real implementation, store the wallet info in a database
    // For now, log the information (in production, never log private keys or seed phrases!)
    logger.info('Wallet generated from seed phrase', { 
      userId, 
      publicKey,
      encryptedPrivateKey: `${encryptedPrivateKey.substring(0, 10)}...` // Only log a portion for security
    });
    
    return publicKey;
  } catch (error) {
    logger.error('Error generating wallet from seed phrase', error);
    throw new Error(`Failed to generate wallet from seed phrase: ${error.message}`);
  }
}
