import { Module } from '@nestjs/common';
import { KycService } from './verify-user';

@Module({
  providers: [
    {
      provide: KycService,
      useFactory: () => {
        return new KycService({
          provider: process.env.KYC_PROVIDER as any || 'mock',
          apiKey: process.env.KYC_API_KEY || '',
          apiUrl: process.env.KYC_API_URL,
          webhookSecret: process.env.KYC_WEBHOOK_SECRET
        });
      }
    }
  ],
  exports: [KycService]
})
export class KycAdapterModule {}
