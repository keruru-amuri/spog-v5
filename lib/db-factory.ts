import { DB_CONFIG } from './config';
import { supabase } from './supabase';
import { azureDb } from './azure-db';

/**
 * Database factory to get the appropriate database client
 * based on the configured provider
 */
export class DbFactory {
  /**
   * Get the database client based on the configured provider
   * @returns Database client
   */
  static getDbClient() {
    if (DB_CONFIG.dbProvider === 'supabase') {
      return supabase;
    } else if (DB_CONFIG.dbProvider === 'azure') {
      return azureDb;
    } else {
      throw new Error(`Invalid database provider: ${DB_CONFIG.dbProvider}`);
    }
  }
}

// Export a function to get the database client
export function getDb() {
  return DbFactory.getDbClient();
}
