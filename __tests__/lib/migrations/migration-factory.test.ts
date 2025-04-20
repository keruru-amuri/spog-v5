import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMigration, createSqlMigration, createFileMigration } from '../../../lib/migrations/migration-factory';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../types/supabase';

// Mock fs
vi.mock('fs', () => {
  return {
    readFileSync: vi.fn().mockReturnValue('-- SQL content'),
  };
});

describe('Migration Factory', () => {
  describe('createMigration', () => {
    it('should create a migration with the given name and functions', async () => {
      const upFn = vi.fn();
      const downFn = vi.fn();

      const migration = createMigration('test_migration', upFn, downFn);

      expect(migration.name).toBe('test_migration');
      expect(migration.up).toBe(upFn);
      expect(migration.down).toBe(downFn);

      // Call the functions to make sure they work
      const client = {} as SupabaseClient<Database>;
      await migration.up(client);
      await migration.down(client);

      expect(upFn).toHaveBeenCalledWith(client);
      expect(downFn).toHaveBeenCalledWith(client);
    });
  });

  describe('createSqlMigration', () => {
    it('should create a migration with SQL strings', async () => {
      const upSql = 'CREATE TABLE test (id INT);';
      const downSql = 'DROP TABLE test;';

      const migration = createSqlMigration('test_migration', upSql, downSql);

      expect(migration.name).toBe('test_migration');

      // Mock client
      const client = {
        rpc: vi.fn().mockReturnValue({ error: null }),
      } as unknown as SupabaseClient<Database>;

      // Call the functions
      await migration.up(client);
      await migration.down(client);

      expect(client.rpc).toHaveBeenCalledWith('exec_sql', { sql: upSql });
      expect(client.rpc).toHaveBeenCalledWith('exec_sql', { sql: downSql });
    });

    it('should throw an error if the SQL execution fails', async () => {
      const upSql = 'CREATE TABLE test (id INT);';
      const downSql = 'DROP TABLE test;';

      const migration = createSqlMigration('test_migration', upSql, downSql);

      // Mock client with error
      const client = {
        rpc: vi.fn().mockReturnValue({ error: new Error('SQL error') }),
      } as unknown as SupabaseClient<Database>;

      // Call the functions
      await expect(migration.up(client)).rejects.toThrow('SQL error');
      await expect(migration.down(client)).rejects.toThrow('SQL error');
    });
  });

  describe('createFileMigration', () => {
    it('should create a migration from SQL files', async () => {
      const fs = require('fs');

      // Create test SQL files in memory
      const upSqlContent = '-- Up SQL content';
      const downSqlContent = '-- Down SQL content';

      // Mock readFileSync to return our content based on the file path
      fs.readFileSync = vi.fn((path) => {
        if (path === 'up.sql') return upSqlContent;
        if (path === 'down.sql') return downSqlContent;
        return '-- Unknown file';
      });

      const migration = createFileMigration('test_migration', 'up.sql', 'down.sql');

      expect(migration.name).toBe('test_migration');

      // Mock client
      const client = {
        rpc: vi.fn().mockReturnValue({ error: null }),
      } as unknown as SupabaseClient<Database>;

      // Call the functions
      await migration.up(client);
      await migration.down(client);

      expect(fs.readFileSync).toHaveBeenCalledWith('up.sql', 'utf8');
      expect(fs.readFileSync).toHaveBeenCalledWith('down.sql', 'utf8');
      expect(client.rpc).toHaveBeenCalledWith('exec_sql', { sql: upSqlContent });
      expect(client.rpc).toHaveBeenCalledWith('exec_sql', { sql: downSqlContent });
    });
  });
});
