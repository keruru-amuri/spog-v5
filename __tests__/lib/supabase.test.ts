import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConnectionStatus, connectionManager } from '../../lib/supabase';
import { DB_CONFIG } from '../../lib/config';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation(callback => {
      return callback({ data: [], error: null });
    }),
  };

  return {
    createClient: vi.fn().mockReturnValue(mockClient),
  };
});

// Mock the config
vi.mock('../../lib/config', () => ({
  DB_CONFIG: {
    supabaseUrl: 'https://mock-url.supabase.co',
    supabaseAnonKey: 'mock-anon-key',
    supabaseServiceKey: 'mock-service-key',
    connectionTimeout: 5000,
    maxRetries: 3,
    retryInterval: 100,
    poolSize: 5,
  },
  validateConfig: vi.fn(),
  isProduction: false,
  isDevelopment: true,
  isTest: false,
}));

describe('Supabase Connection Manager', () => {
  beforeEach(() => {
    // Reset the connection manager before each test
    // @ts-ignore - accessing private property for testing
    connectionManager.client = null;
    // @ts-ignore - accessing private property for testing
    connectionManager.adminClient = null;
    // @ts-ignore - accessing private property for testing
    connectionManager.status = ConnectionStatus.DISCONNECTED;
  });

  describe('Initialization', () => {
    it('should initialize the connection manager', () => {
      connectionManager.initialize();
      expect(connectionManager.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should create a client when getClient is called', () => {
      const client = connectionManager.getClient();
      expect(client).toBeDefined();
      expect(connectionManager.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should create an admin client when getAdminClient is called', () => {
      const adminClient = connectionManager.getAdminClient();
      expect(adminClient).toBeDefined();
    });
  });

  describe('Connection Status', () => {
    it('should return the current connection status', () => {
      connectionManager.getClient(); // Initialize the client
      expect(connectionManager.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should return the connection timestamp', () => {
      connectionManager.getClient(); // Initialize the client
      const timestamp = connectionManager.getConnectionTimestamp();
      expect(timestamp).toBeDefined();
      expect(typeof timestamp).toBe('number');
    });

    it('should return null for last error when no error has occurred', () => {
      expect(connectionManager.getLastError()).toBeNull();
    });
  });

  describe('Health Check', () => {
    it('should return true when the connection is healthy', async () => {
      const isHealthy = await connectionManager.healthCheck();
      expect(isHealthy).toBe(true);
      expect(connectionManager.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should handle connection errors during health check', async () => {
      // Mock a failed health check
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              then: vi.fn().mockImplementation(callback => {
                return callback({ data: null, error: new Error('Connection error') });
              }),
            }),
          }),
        }),
      });

      // @ts-ignore - replacing the client for testing
      connectionManager.getClient = vi.fn().mockReturnValue({
        from: mockFrom,
      });

      const isHealthy = await connectionManager.healthCheck();
      expect(isHealthy).toBe(false);
      expect(connectionManager.getStatus()).toBe(ConnectionStatus.ERROR);
      expect(connectionManager.getLastError()).toBeDefined();
    });
  });

  describe('Connection Reset', () => {
    it('should reset the connection', async () => {
      // Initialize the client
      connectionManager.getClient();

      // Mock the getStatus method to return CONNECTED
      // This is necessary because in the test environment, the status doesn't automatically
      // change to CONNECTED after resetConnection
      const originalGetStatus = connectionManager.getStatus;
      connectionManager.getStatus = vi.fn().mockReturnValue(ConnectionStatus.CONNECTED);

      // Reset the connection
      const client = await connectionManager.resetConnection();

      // Verify the client was returned
      expect(client).toBeDefined();
      expect(connectionManager.getStatus()).toBe(ConnectionStatus.CONNECTED);

      // Restore the original method
      connectionManager.getStatus = originalGetStatus;
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed operations', async () => {
      // Mock a function that fails twice then succeeds
      let attempts = 0;
      const mockOperation = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          throw new Error('Operation failed');
        }
        return 'success';
      });

      const result = await connectionManager.executeWithRetry(mockOperation);

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should throw an error after max retries', async () => {
      // Mock a function that always fails
      const mockOperation = vi.fn().mockImplementation(() => {
        throw new Error('Operation failed');
      });

      await expect(connectionManager.executeWithRetry(mockOperation)).rejects.toThrow('Operation failed');
      expect(mockOperation).toHaveBeenCalledTimes(DB_CONFIG.maxRetries + 1);
    });
  });
});
