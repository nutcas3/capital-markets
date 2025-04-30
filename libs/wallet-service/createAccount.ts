import {
  SystemProgram,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey
} from "@solana/web3.js";
import { logger } from '../utils/logger';
import { decryptPrivateKey } from './encryptWallet';

/**
 * Create a new Solana account
 * @param fromPrivateKey Encrypted private key of the funding account
 * @param encryptionKey Key to decrypt the private key
 * @param space Amount of space to reserve for the account (in bytes)
 * @param lamports Amount of lamports to fund the account with (if not provided, minimum rent exemption will be used)
 * @param programId Program ID that will own the account (defaults to System Program)
 * @param cluster Solana cluster to use (mainnet-beta, testnet, devnet)
 * @returns Object containing the new account's keypair and transaction signature
 */
export async function createAccount(
  fromPrivateKey: string,
  encryptionKey: string,
  space: number = 0,
  lamports?: number,
  programId: string = SystemProgram.programId.toString(),
  cluster: 'mainnet-beta' | 'testnet' | 'devnet' = 'devnet'
): Promise<{
  publicKey: string;
  privateKey: string;
  signature: string;
}> {
  logger.info('Creating Solana account', { space, programId, cluster });
  
  try {
    // Decrypt the private key
    const decryptedPrivateKey = await decryptPrivateKey(fromPrivateKey, encryptionKey);
    
    // Create a keypair from the private key
    const privateKeyBytes = Buffer.from(decryptedPrivateKey, 'hex');
    const fromKeypair = Keypair.fromSecretKey(privateKeyBytes);
    
    // Generate a new account keypair
    const newAccount = Keypair.generate();
    
    // Connect to Solana
    const connection = new Connection(
      cluster === 'mainnet-beta' 
        ? 'https://api.mainnet-beta.solana.com' 
        : clusterApiUrl(cluster),
      'confirmed'
    );
    
    // Calculate minimum rent exemption if lamports not provided
    const rentLamports = lamports ?? await connection.getMinimumBalanceForRentExemption(space);
    
    // Create the transaction
    const createAccountTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: fromKeypair.publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: rentLamports,
        space,
        programId: new PublicKey(programId)
      })
    );
    
    // Set recent blockhash
    createAccountTransaction.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    createAccountTransaction.feePayer = fromKeypair.publicKey;
    
    // Sign and send the transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      createAccountTransaction,
      [fromKeypair, newAccount]
    );
    
    logger.info('Account created successfully', { 
      newAccountPublicKey: newAccount.publicKey.toString(),
      signature 
    });
    
    // Return the new account information
    return {
      publicKey: newAccount.publicKey.toString(),
      privateKey: Buffer.from(newAccount.secretKey).toString('hex'),
      signature
    };
  } catch (error) {
    logger.error('Error creating account', error);
    throw new Error(`Failed to create account: ${error.message}`);
  }
}

/**
 * Request an airdrop of SOL to an account (only works on devnet and testnet)
 * @param publicKey Public key of the account to receive the airdrop
 * @param amount Amount of SOL to airdrop
 * @param cluster Solana cluster to use (testnet or devnet)
 * @returns Airdrop transaction signature
 */
export async function requestAirdrop(
  publicKey: string,
  amount: number = 1,
  cluster: 'testnet' | 'devnet' = 'devnet'
): Promise<string> {
  logger.info('Requesting SOL airdrop', { publicKey, amount, cluster });
  
  try {
    // Connect to Solana
    const connection = new Connection(clusterApiUrl(cluster), 'confirmed');
    
    // Request the airdrop
    const airdropSignature = await connection.requestAirdrop(
      new PublicKey(publicKey),
      amount * LAMPORTS_PER_SOL
    );
    
    // Confirm the transaction
    await connection.confirmTransaction(airdropSignature);
    
    logger.info('Airdrop successful', { publicKey, amount, signature: airdropSignature });
    
    return airdropSignature;
  } catch (error) {
    logger.error('Error requesting airdrop', error);
    throw new Error(`Failed to request airdrop: ${error.message}`);
  }
}

/**
 * Create and fund a new Solana account (convenience function)
 * @param cluster Solana cluster to use (testnet or devnet)
 * @returns Object containing the new account's keypair and transaction signatures
 */
export async function createAndFundAccount(
  cluster: 'testnet' | 'devnet' = 'devnet'
): Promise<{
  publicKey: string;
  privateKey: string;
  createSignature: string;
  airdropSignature: string;
}> {
  logger.info('Creating and funding Solana account', { cluster });
  
  try {
    // Generate a temporary funding keypair
    const fromKeypair = Keypair.generate();
    const fromPublicKey = fromKeypair.publicKey.toString();
    
    // Request an airdrop to the funding account
    const airdropSignature = await requestAirdrop(fromPublicKey, 1, cluster);
    
    // Connect to Solana
    const connection = new Connection(clusterApiUrl(cluster), 'confirmed');
    
    // Generate a new account keypair
    const newAccount = Keypair.generate();
    
    // Calculate minimum rent exemption
    const space = 0;
    const rentLamports = await connection.getMinimumBalanceForRentExemption(space);
    
    // Create the transaction
    const createAccountTransaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: fromKeypair.publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: rentLamports,
        space,
        programId: SystemProgram.programId
      })
    );
    
    // Sign and send the transaction
    const createSignature = await sendAndConfirmTransaction(
      connection,
      createAccountTransaction,
      [fromKeypair, newAccount]
    );
    
    logger.info('Account created and funded successfully', { 
      newAccountPublicKey: newAccount.publicKey.toString(),
      createSignature 
    });
    
    // Return the new account information
    return {
      publicKey: newAccount.publicKey.toString(),
      privateKey: Buffer.from(newAccount.secretKey).toString('hex'),
      createSignature,
      airdropSignature
    };
  } catch (error) {
    logger.error('Error creating and funding account', error);
    throw new Error(`Failed to create and fund account: ${error.message}`);
  }
}
