/**
 * Application configuration from environment variables
 * with validation and default values
 */

// Database configuration
export const DB_CONFIG = {
  // Supabase configuration
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Connection configuration
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
  retryInterval: parseInt(process.env.DB_RETRY_INTERVAL || '1000', 10),
  poolSize: parseInt(process.env.DB_POOL_SIZE || '10', 10),
};

/**
 * Validate required configuration values
 * @throws Error if any required configuration is missing
 */
export function validateConfig(): void {
  const requiredEnvVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: DB_CONFIG.supabaseUrl },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: DB_CONFIG.supabaseAnonKey },
  ];

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
