import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { DB_CONFIG, validateConfig } from './config';

/**
 * Connection status enum
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  ERROR = 'error',
}

/**
 * Database connection manager for Supabase
 */
class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager;
  private client: SupabaseClient<Database> | null = null;
  private adminClient: SupabaseClient<Database> | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private retryCount = 0;
  private connectionPromise: Promise<SupabaseClient<Database>> | null = null;
  private lastError: Error | null = null;
  private connectionTimestamp: number | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager();
    }
    return SupabaseConnectionManager.instance;
  }

  /**
   * Initialize the connection manager
   * This should be called early in the application lifecycle
   */
  public initialize(): void {
    try {
      validateConfig();
      this.getClient(); // Initialize the client
      console.log('Supabase connection manager initialized');
    } catch (error) {
      console.error('Failed to initialize Supabase connection manager:', error);
      throw error;
    }
  }

  /**
   * Get the Supabase client (creates it if it doesn't exist)
   * @returns Supabase client
   */
  public getClient(): SupabaseClient<Database> {
    if (!this.client) {
      this.client = this.createClient();
      this.status = ConnectionStatus.CONNECTED;
      this.connectionTimestamp = Date.now();
    }
    return this.client;
  }

  /**
   * Get the Supabase admin client with service role key
   * @returns Supabase admin client
   */
  public getAdminClient(): SupabaseClient<Database> {
    if (!this.adminClient && DB_CONFIG.supabaseServiceKey) {
      this.adminClient = createClient<Database>(
        DB_CONFIG.supabaseUrl,
        DB_CONFIG.supabaseServiceKey,
        {
          auth: {
            persistSession: false,
          },
        }
      );
    }

    if (!this.adminClient) {
      throw new Error('Admin client not available: missing service key');
    }

    return this.adminClient;
  }

  /**
   * Create a new Supabase client
   * @returns Supabase client
   */
  private createClient(): SupabaseClient<Database> {
    return createClient<Database>(
      DB_CONFIG.supabaseUrl,
      DB_CONFIG.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: this.fetchWithTimeout,
        },
      }
    );
  }

  /**
   * Custom fetch implementation with timeout
   */
  private fetchWithTimeout = async (input: RequestInfo, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DB_CONFIG.connectionTimeout);

    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${DB_CONFIG.connectionTimeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  /**
   * Get the current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get the last error that occurred
   */
  public getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Get the connection timestamp
   */
  public getConnectionTimestamp(): number | null {
    return this.connectionTimestamp;
  }

  /**
   * Check if the connection is healthy
   * @returns Promise resolving to true if healthy, false otherwise
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();
      const { error } = await client.from('inventory_items').select('id').limit(1);

      if (error) {
        this.status = ConnectionStatus.ERROR;
        this.lastError = new Error(error.message);
        return false;
      }

      this.status = ConnectionStatus.CONNECTED;
      return true;
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      this.lastError = error instanceof Error ? error : new Error(String(error));
      return false;
    }
  }

  /**
   * Reset the connection
   * @returns Promise resolving to the new client
   */
  public async resetConnection(): Promise<SupabaseClient<Database>> {
    this.status = ConnectionStatus.CONNECTING;
    this.client = null;
    this.adminClient = null;
    this.retryCount = 0;

    return this.getClient();
  }

  /**
   * Execute a database operation with retry logic
   * @param operation Function that performs the database operation
   * @param maxRetries Maximum number of retries (defaults to DB_CONFIG.maxRetries)
   * @returns Promise resolving to the operation result
   */
  public async executeWithRetry<T>(
    operation: (client: SupabaseClient<Database>) => Promise<T>,
    maxRetries = DB_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getClient();
        return await operation(client);
      } catch (error) {
        lastError = error;
        console.error(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);

        if (attempt < maxRetries) {
          // Wait before retrying
          const delay = DB_CONFIG.retryInterval * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Reset connection if needed
          if (this.status === ConnectionStatus.ERROR) {
            await this.resetConnection();
          }
        }
      }
    }

    // If we get here, all retries failed
    this.lastError = lastError instanceof Error ? lastError : new Error(String(lastError));
    throw this.lastError;
  }
}

// Initialize the connection manager
const connectionManager = SupabaseConnectionManager.getInstance();

// Export the Supabase client
export const supabase = connectionManager.getClient();

// Export the connection manager for advanced usage
export { connectionManager };
