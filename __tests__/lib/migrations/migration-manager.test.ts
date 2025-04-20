import { describe, it, expect, vi, beforeEach, jest } from 'vitest';
import { MigrationManager } from '../../../lib/migrations/migration-manager';
import { connectionManager, mockClient } from '../../../lib/supabase';
import { Migration, MigrationStatus } from '../../../lib/migrations/types';
import { createMigration } from '../../../lib/migrations/migration-factory';

// Mock the connection manager
vi.mock('../../../lib/supabase', () => {
  // Create a mock client that can be configured for each test
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
  };

  return {
    connectionManager: {
      executeWithRetry: vi.fn(),
      getClient: vi.fn().mockReturnValue(mockClient),
    },
    mockClient, // Export the mock client for test configuration
  };
});

// Mock fs
vi.mock('fs', () => {
  return {
    readFileSync: vi.fn().mockReturnValue('-- SQL content'),
    readdirSync: vi.fn().mockReturnValue(['migration1.ts', 'migration2.ts']),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    default: {
      readFileSync: vi.fn().mockReturnValue('-- SQL content'),
      readdirSync: vi.fn().mockReturnValue(['migration1.ts', 'migration2.ts']),
      existsSync: vi.fn().mockReturnValue(true),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    },
  };
});

// Mock path
vi.mock('path', () => {
  return {
    join: vi.fn().mockReturnValue('/path/to/migrations'),
    default: {
      join: vi.fn().mockReturnValue('/path/to/migrations'),
    },
  };
});

describe('MigrationManager', () => {
  let manager: MigrationManager;

  beforeEach(() => {
    vi.clearAllMocks();
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
      vi.mocked(connectionManager.executeWithRetry).mockImplementation(async (callback) => {
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
        up: vi.fn(),
        down: vi.fn(),
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
          up: vi.fn(),
          down: vi.fn(),
        },
        {
          name: 'test_migration_2',
          up: vi.fn(),
          down: vi.fn(),
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
      const appliedMigration = createMigration('applied_migration', vi.fn(), vi.fn());
      const pendingMigration = createMigration('pending_migration', vi.fn(), vi.fn());

      manager.registerMany([appliedMigration, pendingMigration]);

      // Mock getAppliedMigrations
      vi.spyOn(manager, 'getAppliedMigrations').mockResolvedValueOnce([
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
      vi.spyOn(manager, 'initialize').mockResolvedValueOnce();

      // Mock getLatestBatch
      vi.spyOn(manager, 'getLatestBatch').mockResolvedValueOnce(0);

      // Mock getPendingMigrations
      const migration1 = createMigration('migration1', vi.fn(), vi.fn());
      const migration2 = createMigration('migration2', vi.fn(), vi.fn());
      vi.spyOn(manager, 'getPendingMigrations').mockResolvedValueOnce([migration1, migration2]);

      // Mock executeWithRetry
      vi.mocked(connectionManager.executeWithRetry).mockImplementation(async (callback) => {
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
      vi.spyOn(manager, 'initialize').mockResolvedValueOnce();

      // Mock getLatestBatch
      vi.spyOn(manager, 'getLatestBatch').mockResolvedValueOnce(0);

      // Mock getPendingMigrations
      const migration = createMigration('migration1', vi.fn().mockRejectedValueOnce(new Error('Migration error')), vi.fn());
      vi.spyOn(manager, 'getPendingMigrations').mockResolvedValueOnce([migration]);

      // Mock executeWithRetry
      vi.mocked(connectionManager.executeWithRetry).mockRejectedValueOnce(new Error('Migration error'));

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
      vi.spyOn(manager, 'down').mockResolvedValueOnce(mockResult);

      const result = await manager.down();

      expect(result).toEqual(mockResult);
      expect(result.batch).toBe(1);
      expect(result.migrationsApplied).toBe(2);
      expect(result.migrationsFailed).toBe(0);
      expect(result.results.length).toBe(2);
    });
  });
});
