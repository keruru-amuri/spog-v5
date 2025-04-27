import { Pool, PoolClient } from 'pg';
import { DB_CONFIG } from './config';

/**
 * Azure PostgreSQL database client
 * This class provides methods to interact with the Azure PostgreSQL database
 */
export class AzureDbClient {
  private pool: Pool;
  private static instance: AzureDbClient;

  /**
   * Get the singleton instance of the AzureDbClient
   * @returns AzureDbClient instance
   */
  public static getInstance(): AzureDbClient {
    if (!AzureDbClient.instance) {
      AzureDbClient.instance = new AzureDbClient();
    }
    return AzureDbClient.instance;
  }

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.pool = new Pool({
      host: DB_CONFIG.postgresHost,
      port: DB_CONFIG.postgresPort,
      database: DB_CONFIG.postgresDb,
      user: DB_CONFIG.postgresUser,
      password: DB_CONFIG.postgresPassword,
      ssl: {
        rejectUnauthorized: false // Required for Azure PostgreSQL
      },
      max: DB_CONFIG.poolSize,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: DB_CONFIG.connectionTimeout,
    });

    console.log('Azure PostgreSQL connection configured with:', {
      host: DB_CONFIG.postgresHost,
      port: DB_CONFIG.postgresPort,
      database: DB_CONFIG.postgresDb,
      user: DB_CONFIG.postgresUser,
      ssl: true
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  /**
   * Execute a query with parameters
   * @param text SQL query text
   * @param params Query parameters
   * @returns Query result
   */
  async query<T>(text: string, params: any[] = []): Promise<T[]> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result.rows as T[];
    } finally {
      client.release();
    }
  }

  /**
   * Execute a query and return a single row
   * @param text SQL query text
   * @param params Query parameters
   * @returns Single row or null if not found
   */
  async queryOne<T>(text: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Execute a transaction with multiple queries
   * @param callback Function that executes queries within the transaction
   * @returns Result of the callback function
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool
   * @returns Database client
   */
  private async getClient(): Promise<PoolClient> {
    let retries = 0;
    const maxRetries = DB_CONFIG.maxRetries;
    const retryInterval = DB_CONFIG.retryInterval;

    while (retries < maxRetries) {
      try {
        return await this.pool.connect();
      } catch (error) {
        retries++;
        console.error(`Error connecting to database (attempt ${retries}/${maxRetries}):`, error);

        if (retries >= maxRetries) {
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }

    throw new Error('Failed to connect to database after multiple attempts');
  }

  /**
   * Close all connections in the pool
   */
  async end(): Promise<void> {
    await this.pool.end();
  }
}

// Export a singleton instance
export const azureDb = AzureDbClient.getInstance();
