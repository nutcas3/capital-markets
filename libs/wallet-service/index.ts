export * from './generateWallet';
export * from './encryptWallet';
export * from './walletOperations';
export * from './createAccount';

export async function createAndSetupWallet(
  userId: string,
  encryptionKey: string
): Promise<{
  walletAddress: string;
  encryptedPrivateKey: string;
}> {
  const { generateWallet } = require('./generateWallet');
  const { encryptPrivateKey } = require('./encryptWallet');
  
  // Generate a new wallet
  const walletAddress = await generateWallet(userId, encryptionKey);
  
  // In a real implementation, this would retrieve the encrypted private key from a database
  // For now, generate a mock encrypted private key
  const mockPrivateKey = Buffer.from(Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''), 'hex');
  const encryptedPrivateKey = await encryptPrivateKey(mockPrivateKey.toString('hex'), encryptionKey);
  
  return {
    walletAddress,
    encryptedPrivateKey
  };
}
