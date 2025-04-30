export const config = {
  whatsapp: {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    apiToken: process.env.WHATSAPP_API_TOKEN || '',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    wsUrl: process.env.SOLANA_WS_URL,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || '',
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_API_TOKEN',
  'DATABASE_URL',
  'ENCRYPTION_KEY',
  'REDIS_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
