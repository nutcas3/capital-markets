import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { logger } from '@perena/utils';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const PORT = configService.get<number>('PORT') || 3000;

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Apply validation pipe globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Security middleware
  app.use(helmet());

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    }),
  );

  // Start the server
  await app.listen(PORT);
  logger.info(`Server is running on port ${PORT}`);
}

bootstrap().catch(err => {
  logger.error('Error starting server:', err);
  process.exit(1);
});
