import { createMigration, createSqlMigration, createFileMigration } from '../../../lib/migrations/migration-factory';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../types/supabase';

// Mock fs
jest.mock('fs', () => {
  return {
    readFileSync: jest.fn().mockReturnValue('-- SQL content'),
  };
});

describe('Migration Factory', () => {
  describe('createMigration', () => {
    it('should create a migration with the given name and functions', async () => {
      const upFn = jest.fn();
      const downFn = jest.fn();
      
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
        rpc: jest.fn().mockReturnValue({ error: null }),
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
        rpc: jest.fn().mockReturnValue({ error: new Error('SQL error') }),
      } as unknown as SupabaseClient<Database>;
      
      // Call the functions
      await expect(migration.up(client)).rejects.toThrow('SQL error');
      await expect(migration.down(client)).rejects.toThrow('SQL error');
    });
  });
  
  describe('createFileMigration', () => {
    it('should create a migration from SQL files', async () => {
      const fs = require('fs');
      
      const migration = createFileMigration('test_migration', 'up.sql', 'down.sql');
      
      expect(migration.name).toBe('test_migration');
      
      // Mock client
      const client = {
        rpc: jest.fn().mockReturnValue({ error: null }),
      } as unknown as SupabaseClient<Database>;
      
      // Call the functions
      await migration.up(client);
      await migration.down(client);
      
      expect(fs.readFileSync).toHaveBeenCalledWith('up.sql', 'utf8');
      expect(fs.readFileSync).toHaveBeenCalledWith('down.sql', 'utf8');
      expect(client.rpc).toHaveBeenCalledWith('exec_sql', { sql: '-- SQL content' });
    });
  });
});
