import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;

export async function encrypt(data: string, key: string): Promise<string> {
  // Generate salt and derive key
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await deriveKey(key, salt);
  
  // Generate IV
  const iv = randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: TAG_LENGTH
  });
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);
  
  // Get auth tag
  const tag = cipher.getAuthTag();
  
  // Combine all components
  const result = Buffer.concat([
    salt,
    iv,
    tag,
    encrypted
  ]);
  
  return result.toString('base64');
}

export async function decrypt(encryptedData: string, key: string): Promise<string> {
  const data = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = data.slice(0, SALT_LENGTH);
  const iv = data.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = data.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = data.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  // Derive key
  const derivedKey = await deriveKey(key, salt);
  
  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: TAG_LENGTH
  });
  decipher.setAuthTag(tag);
  
  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  // In production, use a proper key derivation function like PBKDF2
  // This is a simplified version for demonstration
  const crypto = require('crypto');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 32, 'sha256', (err: Error | null, key: Buffer) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
}
