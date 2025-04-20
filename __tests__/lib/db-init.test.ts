import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initializeDatabase, checkDatabaseHealth } from '../../lib/db-init';
import { connectionManager } from '../../lib/supabase';

// Mock the connection manager
vi.mock('../../lib/supabase', () => {
  return {
    connectionManager: {
      initialize: vi.fn(),
      healthCheck: vi.fn(),
    },
  };
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Database Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('initializeDatabase', () => {
    it('should initialize the database connection successfully', () => {
      vi.mocked(connectionManager.initialize).mockImplementation(() => {});

      initializeDatabase();

      expect(connectionManager.initialize).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Database connection initialized successfully');
    });

    it('should handle initialization errors', () => {
      const mockError = new Error('Initialization error');
      vi.mocked(connectionManager.initialize).mockImplementation(() => {
        throw mockError;
      });

      expect(() => initializeDatabase()).toThrow(mockError);
      expect(connectionManager.initialize).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Failed to initialize database connection:', mockError);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return true when the database is healthy', async () => {
      vi.mocked(connectionManager.healthCheck).mockResolvedValue(true);

      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(true);
      expect(connectionManager.healthCheck).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Database connection is healthy');
    });

    it('should return false when the database is unhealthy', async () => {
      vi.mocked(connectionManager.healthCheck).mockResolvedValue(false);

      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(false);
      expect(connectionManager.healthCheck).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Database connection is unhealthy');
    });

    it('should handle health check errors', async () => {
      const mockError = new Error('Health check error');
      vi.mocked(connectionManager.healthCheck).mockRejectedValue(mockError);

      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(false);
      expect(connectionManager.healthCheck).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Error checking database health:', mockError);
    });
  });
});
