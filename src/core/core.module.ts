import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/validation.schema';
import { databaseConfig } from './config/database.config';
import { jwtConfig } from './config/jwt.config';
import { ConfigDemoService } from './config/config-demo.service';

/**
 * CoreModule - Global module for shared application-wide services
 *
 * This module configures:
 * - Environment variable loading and validation
 * - Global ConfigService availability
 * - Custom configuration factories for organized config access
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      // Make ConfigService available globally without re-importing ConfigModule
      isGlobal: true,

      // Specify the environment file to load
      envFilePath: '.env',

      // Load custom configuration factories for organized config access
      load: [databaseConfig, jwtConfig],

      // Validate environment variables on application startup
      validationSchema,

      // Validation options
      validationOptions: {
        // Allow unknown environment variables (useful for system env vars)
        allowUnknown: true,

        // Abort application startup if validation fails
        abortEarly: true,
      },

      // Expand variables in .env file (e.g., ${VAR_NAME})
      expandVariables: true,
    }),
  ],
  providers: [ConfigDemoService],
  exports: [ConfigDemoService],
})
export class CoreModule {}
