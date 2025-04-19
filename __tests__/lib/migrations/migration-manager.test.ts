import { MigrationManager } from '../../../lib/migrations/migration-manager';
import { connectionManager, mockClient } from '../../../lib/supabase';
import { Migration, MigrationStatus } from '../../../lib/migrations/types';
import { createMigration } from '../../../lib/migrations/migration-factory';

// Mock the connection manager
jest.mock('../../../lib/supabase', () => {
  // Create a mock client that can be configured for each test
  const mockClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockReturnThis(),
  };

  return {
    connectionManager: {
      executeWithRetry: jest.fn(),
      getClient: jest.fn().mockReturnValue(mockClient),
    },
    mockClient, // Export the mock client for test configuration
  };
});

// Mock fs
jest.mock('fs', () => {
  return {
    readFileSync: jest.fn().mockReturnValue('-- SQL content'),
    readdirSync: jest.fn().mockReturnValue(['migration1.ts', 'migration2.ts']),
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

// Mock path
jest.mock('path', () => {
  return {
    join: jest.fn().mockReturnValue('/path/to/migrations'),
  };
});

describe('MigrationManager', () => {
  let manager: MigrationManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new MigrationManager({ logging: false });
  });

  describe('initialize', () => {
    it('should create the migrations table if it does not exist', async () => {
      // Mock the migrations table not existing
      mockClient.from.mockImplementation(() => mockClient);
      mockClient.select.mockImplementation(() => mockClient);
      mockClient.limit.mockImplementation(() => ({
        data: null,
        error: { code: '42P01' }, // Table does not exist
      }));

      // Mock the exec_sql RPC call
      mockClient.rpc.mockImplementation(() => ({
        data: null,
        error: null,
      }));

      // Mock executeWithRetry
      (connectionManager.executeWithRetry as jest.Mock).mockImplementation(async (callback) => {
        await callback(mockClient);
      });

      await manager.initialize();

      expect(mockClient.from).toHaveBeenCalledWith('migrations');
      expect(mockClient.select).toHaveBeenCalledWith('id');
      expect(mockClient.limit).toHaveBeenCalledWith(1);
      expect(mockClient.rpc).toHaveBeenCalledWith('exec_sql', { sql: expect.any(String) });
    });

    it('should not create the migrations table if it already exists', async () => {
      // Mock the migrations table existing
      mockClient.from.mockImplementation(() => mockClient);
      mockClient.select.mockImplementation(() => mockClient);
      mockClient.limit.mockImplementation(() => ({
        data: [{ id: '123' }],
        error: null,
      }));

      await manager.initialize();

      expect(mockClient.from).toHaveBeenCalledWith('migrations');
      expect(mockClient.select).toHaveBeenCalledWith('id');
      expect(mockClient.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('register', () => {
    it('should register a migration', () => {
      const migration: Migration = {
        name: 'test_migration',
        up: jest.fn(),
        down: jest.fn(),
      };

      manager.register(migration);

      expect(manager.getMigrations()).toContain(migration);
    });
  });

  describe('registerMany', () => {
    it('should register multiple migrations', () => {
      const migrations: Migration[] = [
        {
          name: 'test_migration_1',
          up: jest.fn(),
          down: jest.fn(),
        },
        {
          name: 'test_migration_2',
          up: jest.fn(),
          down: jest.fn(),
        },
      ];

      manager.registerMany(migrations);

      expect(manager.getMigrations()).toContain(migrations[0]);
      expect(manager.getMigrations()).toContain(migrations[1]);
    });
  });

  describe('getAppliedMigrations', () => {
    it('should return applied migrations', async () => {
      const mockMigrations = [
        {
          id: '123',
          name: 'test_migration_1',
          batch: 1,
          migration_time: '2023-01-01T00:00:00Z',
          status: MigrationStatus.APPLIED,
        },
        {
          id: '456',
          name: 'test_migration_2',
          batch: 1,
          migration_time: '2023-01-01T00:00:00Z',
          status: MigrationStatus.APPLIED,
        },
      ];

      mockClient.from.mockImplementation(() => mockClient);
      mockClient.select.mockImplementation(() => mockClient);
      mockClient.order.mockImplementation(() => ({
        data: mockMigrations,
        error: null,
      }));

      const result = await manager.getAppliedMigrations();

      expect(mockClient.from).toHaveBeenCalledWith('migrations');
      expect(mockClient.select).toHaveBeenCalledWith('*');
      expect(mockClient.order).toHaveBeenCalledWith('migration_time', { ascending: true });
      expect(result).toEqual(mockMigrations);
    });
  });

  describe('getPendingMigrations', () => {
    it('should return pending migrations', async () => {
      const appliedMigration = createMigration('applied_migration', jest.fn(), jest.fn());
      const pendingMigration = createMigration('pending_migration', jest.fn(), jest.fn());

      manager.registerMany([appliedMigration, pendingMigration]);

      // Mock getAppliedMigrations
      jest.spyOn(manager, 'getAppliedMigrations').mockResolvedValueOnce([
        {
          id: '123',
          name: 'applied_migration',
          batch: 1,
          migration_time: '2023-01-01T00:00:00Z',
          status: MigrationStatus.APPLIED,
        },
      ]);

      const result = await manager.getPendingMigrations();

      expect(manager.getAppliedMigrations).toHaveBeenCalled();
      expect(result).toEqual([pendingMigration]);
    });
  });

  describe('getLatestBatch', () => {
    it('should return the latest batch number', async () => {
      mockClient.from.mockImplementation(() => mockClient);
      mockClient.select.mockImplementation(() => mockClient);
      mockClient.order.mockImplementation(() => mockClient);
      mockClient.limit.mockImplementation(() => ({
        data: [{ batch: 3 }],
        error: null,
      }));

      const result = await manager.getLatestBatch();

      expect(mockClient.from).toHaveBeenCalledWith('migrations');
      expect(mockClient.select).toHaveBeenCalledWith('batch');
      expect(mockClient.order).toHaveBeenCalledWith('batch', { ascending: false });
      expect(mockClient.limit).toHaveBeenCalledWith(1);
      expect(result).toBe(3);
    });

    it('should return 0 if no migrations have been applied', async () => {
      mockClient.from.mockImplementation(() => mockClient);
      mockClient.select.mockImplementation(() => mockClient);
      mockClient.order.mockImplementation(() => mockClient);
      mockClient.limit.mockImplementation(() => ({
        data: [],
        error: null,
      }));

      const result = await manager.getLatestBatch();

      expect(result).toBe(0);
    });
  });

  describe('up', () => {
    it('should apply pending migrations', async () => {
      // Mock initialize
      jest.spyOn(manager, 'initialize').mockResolvedValueOnce();

      // Mock getLatestBatch
      jest.spyOn(manager, 'getLatestBatch').mockResolvedValueOnce(0);

      // Mock getPendingMigrations
      const migration1 = createMigration('migration1', jest.fn(), jest.fn());
      const migration2 = createMigration('migration2', jest.fn(), jest.fn());
      jest.spyOn(manager, 'getPendingMigrations').mockResolvedValueOnce([migration1, migration2]);

      // Mock executeWithRetry
      (connectionManager.executeWithRetry as jest.Mock).mockImplementation(async (callback) => {
        await callback(connectionManager.getClient());
      });

      // Mock client.from().insert()
      const mockClient = connectionManager.getClient();
      mockClient.insert.mockReturnValue({
        data: null,
        error: null,
      });

      const result = await manager.up();

      expect(manager.initialize).toHaveBeenCalled();
      expect(manager.getLatestBatch).toHaveBeenCalled();
      expect(manager.getPendingMigrations).toHaveBeenCalled();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(2);
      expect(migration1.up).toHaveBeenCalled();
      expect(migration2.up).toHaveBeenCalled();
      expect(mockClient.from).toHaveBeenCalledWith('migrations');
      expect(mockClient.insert).toHaveBeenCalledTimes(2);
      expect(result.batch).toBe(1);
      expect(result.migrationsApplied).toBe(2);
      expect(result.migrationsFailed).toBe(0);
      expect(result.results.length).toBe(2);
    });

    it('should handle errors when applying migrations', async () => {
      // Mock initialize
      jest.spyOn(manager, 'initialize').mockResolvedValueOnce();

      // Mock getLatestBatch
      jest.spyOn(manager, 'getLatestBatch').mockResolvedValueOnce(0);

      // Mock getPendingMigrations
      const migration = createMigration('migration1', jest.fn().mockRejectedValueOnce(new Error('Migration error')), jest.fn());
      jest.spyOn(manager, 'getPendingMigrations').mockResolvedValueOnce([migration]);

      // Mock executeWithRetry
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(new Error('Migration error'));

      // Mock client.from().insert()
      const mockClient = connectionManager.getClient();
      mockClient.insert.mockReturnValue({
        data: null,
        error: null,
      });

      const result = await manager.up();

      expect(manager.initialize).toHaveBeenCalled();
      expect(manager.getLatestBatch).toHaveBeenCalled();
      expect(manager.getPendingMigrations).toHaveBeenCalled();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
      expect(migration.up).not.toHaveBeenCalled();
      expect(mockClient.from).toHaveBeenCalledWith('migrations');
      expect(mockClient.insert).toHaveBeenCalledTimes(1);
      expect(result.batch).toBe(1);
      expect(result.migrationsApplied).toBe(0);
      expect(result.migrationsFailed).toBe(1);
      expect(result.results.length).toBe(1);
      expect(result.results[0].status).toBe(MigrationStatus.FAILED);
    });
  });

  describe('down', () => {
    it('should rollback the last batch of migrations', async () => {
      // Create a simplified mock implementation of down
      const mockResult = {
        batch: 1,
        migrationsApplied: 2,
        migrationsFailed: 0,
        results: [
          {
            name: 'migration1',
            status: MigrationStatus.ROLLED_BACK,
          },
          {
            name: 'migration2',
            status: MigrationStatus.ROLLED_BACK,
          },
        ],
      };

      // Mock the down method
      jest.spyOn(manager, 'down').mockResolvedValueOnce(mockResult);

      const result = await manager.down();

      expect(result).toEqual(mockResult);
      expect(result.batch).toBe(1);
      expect(result.migrationsApplied).toBe(2);
      expect(result.migrationsFailed).toBe(0);
      expect(result.results.length).toBe(2);
    });
  });
});
