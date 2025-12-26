/**
 * Environment variable validation
 * Ensures all required environment variables are present before starting the server
 */

import { logger, logError } from './logger';

interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * List of required environment variables for the application to function
 */
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'VITE_APP_ID',
  'OWNER_OPEN_ID',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
] as const;

/**
 * List of recommended but not strictly required environment variables
 */
const RECOMMENDED_ENV_VARS = [
  'VITE_APP_TITLE',
  'VITE_APP_LOGO',
  'OAUTH_SERVER_URL',
  'VITE_OAUTH_PORTAL_URL',
] as const;

/**
 * Validate that all required environment variables are present
 */
export function validateEnvironment(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check recommended variables
  for (const varName of RECOMMENDED_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate environment and exit if critical variables are missing
 * Should be called at application startup
 */
export function validateEnvironmentOrExit(): void {
  logger.info('Validating environment variables...');

  const result = validateEnvironment();

  // Log warnings for missing recommended variables
  if (result.warnings.length > 0) {
    logger.warn('Some recommended environment variables are missing:', {
      missing: result.warnings,
    });
  }

  // Exit if required variables are missing
  if (!result.valid) {
    logError('Critical environment variables are missing. Cannot start server.', undefined, {
      missing: result.missing,
    });
    
    console.error('\n❌ MISSING REQUIRED ENVIRONMENT VARIABLES:');
    result.missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease set these variables in your .env file or environment.\n');
    
    process.exit(1);
  }

  logger.info('✅ All required environment variables are present');

  // Log additional validation info
  validateDatabaseUrl();
  validateJwtSecret();
}

/**
 * Validate DATABASE_URL format
 */
function validateDatabaseUrl(): void {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  try {
    const url = new URL(dbUrl);
    
    if (!url.protocol.startsWith('mysql')) {
      logger.warn('DATABASE_URL does not appear to be a MySQL connection string', {
        protocol: url.protocol,
      });
    }

    if (!url.hostname) {
      logger.warn('DATABASE_URL is missing hostname');
    }

    logger.info('Database URL validated', {
      protocol: url.protocol,
      host: url.hostname,
      database: url.pathname.slice(1),
    });
  } catch (error) {
    logger.warn('DATABASE_URL format could not be parsed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate JWT_SECRET strength
 */
function validateJwtSecret(): void {
  const secret = process.env.JWT_SECRET;
  if (!secret) return;

  if (secret.length < 32) {
    logger.warn('JWT_SECRET is shorter than recommended (should be at least 32 characters)', {
      length: secret.length,
    });
  }

  if (secret === 'your-secret-key' || secret === 'change-me' || secret === 'secret') {
    logger.error('JWT_SECRET is using a default/weak value. This is a CRITICAL security risk!');
  }

  logger.info('JWT_SECRET validated', {
    length: secret.length,
    strong: secret.length >= 32,
  });
}

/**
 * Get a safe summary of environment configuration (without sensitive values)
 */
export function getEnvironmentSummary(): Record<string, string> {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    DATABASE_CONFIGURED: process.env.DATABASE_URL ? 'Yes' : 'No',
    JWT_CONFIGURED: process.env.JWT_SECRET ? 'Yes' : 'No',
    OAUTH_CONFIGURED: process.env.OAUTH_SERVER_URL ? 'Yes' : 'No',
    STRIPE_CONFIGURED: process.env.STRIPE_SECRET_KEY ? 'Yes' : 'No',
    APP_ID: process.env.VITE_APP_ID || 'Not set',
    APP_TITLE: process.env.VITE_APP_TITLE || 'Not set',
  };
}
