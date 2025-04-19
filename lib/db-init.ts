import { connectionManager } from './supabase';

/**
 * Initialize the database connection
 * This should be called early in the application lifecycle
 */
export function initializeDatabase(): void {
  try {
    connectionManager.initialize();
    console.log('Database connection initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    throw error;
  }
}

/**
 * Check the database connection health
 * @returns Promise resolving to true if healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const isHealthy = await connectionManager.healthCheck();
    if (isHealthy) {
      console.log('Database connection is healthy');
    } else {
      console.error('Database connection is unhealthy');
    }
    return isHealthy;
  } catch (error) {
    console.error('Error checking database health:', error);
    return false;
  }
}
