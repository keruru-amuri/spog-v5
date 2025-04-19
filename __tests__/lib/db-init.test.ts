import { initializeDatabase, checkDatabaseHealth } from '../../lib/db-init';
import { connectionManager } from '../../lib/supabase';

// Mock the connection manager
jest.mock('../../lib/supabase', () => {
  return {
    connectionManager: {
      initialize: jest.fn(),
      healthCheck: jest.fn(),
    },
  };
});

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('Database Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('initializeDatabase', () => {
    it('should initialize the database connection successfully', () => {
      (connectionManager.initialize as jest.Mock).mockImplementation(() => {});

      initializeDatabase();

      expect(connectionManager.initialize).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Database connection initialized successfully');
    });

    it('should handle initialization errors', () => {
      const mockError = new Error('Initialization error');
      (connectionManager.initialize as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      expect(() => initializeDatabase()).toThrow(mockError);
      expect(connectionManager.initialize).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Failed to initialize database connection:', mockError);
    });
  });

  describe('checkDatabaseHealth', () => {
    it('should return true when the database is healthy', async () => {
      (connectionManager.healthCheck as jest.Mock).mockResolvedValue(true);

      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(true);
      expect(connectionManager.healthCheck).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('Database connection is healthy');
    });

    it('should return false when the database is unhealthy', async () => {
      (connectionManager.healthCheck as jest.Mock).mockResolvedValue(false);

      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(false);
      expect(connectionManager.healthCheck).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Database connection is unhealthy');
    });

    it('should handle health check errors', async () => {
      const mockError = new Error('Health check error');
      (connectionManager.healthCheck as jest.Mock).mockRejectedValue(mockError);

      const isHealthy = await checkDatabaseHealth();

      expect(isHealthy).toBe(false);
      expect(connectionManager.healthCheck).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith('Error checking database health:', mockError);
    });
  });
});
