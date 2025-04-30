import { Module } from '@nestjs/common';
import { AnalyticsService, AnalyticsProvider } from './analytics.service';

@Module({
  providers: [
    {
      provide: AnalyticsService,
      useFactory: () => {
        return new AnalyticsService({
          provider: (process.env.ANALYTICS_PROVIDER as AnalyticsProvider) || AnalyticsProvider.MOCK,
          apiKey: process.env.ANALYTICS_API_KEY || '',
          options: {
            debug: process.env.NODE_ENV !== 'production'
          }
        });
      }
    }
  ],
  exports: [AnalyticsService]
})
export class AnalyticsServiceModule {}
