/**
 * Application configuration from environment variables
 * with validation and default values
 */

// Database configuration
export const DB_CONFIG = {
  // Supabase configuration (legacy)
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',

  // Azure PostgreSQL configuration
  postgresHost: process.env.POSTGRES_HOST || '',
  postgresPort: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  postgresDb: process.env.POSTGRES_DB || 'postgres',
  postgresUser: process.env.POSTGRES_USER || '',
  postgresPassword: process.env.POSTGRES_PASSWORD || '',

  // Connection configuration
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
  retryInterval: parseInt(process.env.DB_RETRY_INTERVAL || '1000', 10),
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),

  // Database provider - 'supabase' or 'azure'
  dbProvider: process.env.DB_PROVIDER || 'supabase',
};

/**
 * Validate required configuration values
 * @throws Error if any required configuration is missing
 */
export function validateConfig(): void {
  let requiredEnvVars = [];

  // Check database provider and validate accordingly
  if (DB_CONFIG.dbProvider === 'supabase') {
    requiredEnvVars = [
      { key: 'NEXT_PUBLIC_SUPABASE_URL', value: DB_CONFIG.supabaseUrl },
      { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: DB_CONFIG.supabaseAnonKey },
    ];
  } else if (DB_CONFIG.dbProvider === 'azure') {
    requiredEnvVars = [
      { key: 'POSTGRES_HOST', value: DB_CONFIG.postgresHost },
      { key: 'POSTGRES_USER', value: DB_CONFIG.postgresUser },
      { key: 'POSTGRES_PASSWORD', value: DB_CONFIG.postgresPassword },
    ];
  } else {
    throw new Error(`Invalid database provider: ${DB_CONFIG.dbProvider}. Must be 'supabase' or 'azure'.`);
  }

  const missingEnvVars = requiredEnvVars
    .filter(({ value }) => !value)
    .map(({ key }) => key);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
}

/**
 * Check if we're in a production environment
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if we're in a development environment
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if we're in a test environment
 */
export const isTest = process.env.NODE_ENV === 'test';
