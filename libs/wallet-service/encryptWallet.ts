import * as crypto from 'crypto';
import { logger } from '../utils/logger';

/**
 * Encrypt a private key using AES-256-GCM
 * @param privateKey Private key to encrypt
 * @param encryptionKey Key used for encryption
 * @returns Encrypted private key
 */
export async function encryptPrivateKey(privateKey: string, encryptionKey: string): Promise<string> {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create a key buffer from the encryption key
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt the private key
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, encrypted data, and auth tag into a single string
    // Format: iv:encryptedData:authTag
    const result = `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    
    return result;
  } catch (error) {
    logger.error('Error encrypting private key', error);
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

/**
 * Decrypt an encrypted private key
 * @param encryptedPrivateKey Encrypted private key
 * @param encryptionKey Key used for decryption
 * @returns Decrypted private key
 */
export async function decryptPrivateKey(encryptedPrivateKey: string, encryptionKey: string): Promise<string> {
  try {
    // Split the encrypted string into its components
    const [ivHex, encryptedData, authTagHex] = encryptedPrivateKey.split(':');
    
    // Convert components from hex to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create a key buffer from the encryption key
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the private key
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting private key', error);
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
}

/**
 * Generate a secure encryption key
 * @returns Randomly generated encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Derive an encryption key from a password and salt
 * @param password User password
 * @param salt Salt for key derivation
 * @returns Derived encryption key
 */
export async function deriveEncryptionKey(password: string, salt: string): Promise<string> {
  try {
    // Use PBKDF2 to derive a key from the password
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        salt,
        100000, // Number of iterations
        32, // Key length in bytes
        'sha256',
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey.toString('hex'));
        }
      );
    });
  } catch (error) {
    logger.error('Error deriving encryption key', error);
    throw new Error(`Failed to derive encryption key: ${error.message}`);
  }
}
