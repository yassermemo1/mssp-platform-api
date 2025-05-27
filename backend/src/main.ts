import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Bootstrap function - Application entry point
 *
 * This function:
 * - Creates the NestJS application
 * - Configures global validation pipes
 * - Configures the server port from environment variables
 * - Starts the HTTP server
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // Get ConfigService instance to access configuration
  const configService = app.get(ConfigService);

  // Get port from configuration with fallback
  const port = configService.get<number>('PORT', 3000);

  // Get environment for logging
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Enable CORS for development
  if (nodeEnv === 'development') {
    app.enableCors();
  }

  // Start the server
  await app.listen(port);

  console.log(`🚀 MSSP Platform API is running on: http://localhost:${port}`);
  console.log(`📊 Environment: ${nodeEnv}`);
  console.log(`⚙️  Configuration validation: ✅ Passed`);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();
