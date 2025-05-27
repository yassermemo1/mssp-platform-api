import * as Joi from 'joi';

/**
 * Environment variables validation schema using Joi
 * This schema ensures all required environment variables are present
 * and have the correct format when the application starts
 */
export const validationSchema = Joi.object({
  // Application Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('Application environment'),

  // Server Configuration
  PORT: Joi.number()
    .port()
    .default(3000)
    .description('Port number for the application server'),

  // PostgreSQL Database Configuration
  DB_HOST: Joi.string().required().description('PostgreSQL database host'),

  DB_PORT: Joi.number()
    .port()
    .default(5432)
    .description('PostgreSQL database port'),

  DB_USERNAME: Joi.string()
    .required()
    .description('PostgreSQL database username'),

  DB_PASSWORD: Joi.string()
    .required()
    .description('PostgreSQL database password'),

  DB_NAME: Joi.string().required().description('PostgreSQL database name'),

  // JWT Authentication Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key for token signing (minimum 32 characters)'),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('60m')
    .description('JWT token expiration time (e.g., 60m, 24h, 7d)'),
});
