# Perena x WhatsApp Capital Markets Bot

A WhatsApp-based interface for accessing tokenized capital markets on Solana, powered by Perena's Numéraire AMM.

## Features

- Trade stablecoins and synthetic assets via WhatsApp
- Secure, non-custodial Solana wallet management
- Real-time portfolio tracking
- Optional KYC integration
- Multi-language support (coming soon)

## Tech Stack

- Node.js & TypeScript
- Express.js for API
- WhatsApp Business API
- Solana Web3.js
- Prisma with PostgreSQL
- Redis for caching
- Numeraire AMM SDK

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Fill in required environment variables
```

3. Initialize database:
```bash
npx prisma generate
npx prisma db push
```

4. Start development server:
```bash
npm run dev
```

## Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `WHATSAPP_API_TOKEN`: WhatsApp Business API token
- `WHATSAPP_VERIFY_TOKEN`: Webhook verification token
- `ENCRYPTION_KEY`: Master key for wallet encryption
- `SOLANA_RPC_URL`: Solana RPC endpoint

## Project Structure

- `apps/bot-api`: Main WhatsApp bot API
- `libs/wallet-service`: Solana wallet management
- `libs/capital-markets`: Trading and portfolio logic
- `libs/numeraire-wrapper`: AMM integration
- `libs/kyc-adapter`: Optional KYC integration
- `data`: Database schema and migrations

## Development

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Start with PM2:
```bash
pm2 start ecosystem.config.js
```

## Security

- All private keys are encrypted at rest
- Session-based authentication
- Rate limiting on all endpoints
- Regular security audits

## License

Copyright © 2025 Perena Labs. All rights reserved.
