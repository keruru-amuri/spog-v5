import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import { Migration } from './types';

/**
 * Create a new migration
 * @param name Migration name
 * @param upFn Function to apply the migration
 * @param downFn Function to rollback the migration
 * @returns Migration object
 */
export function createMigration(
  name: string,
  upFn: (client: SupabaseClient<Database>) => Promise<void>,
  downFn: (client: SupabaseClient<Database>) => Promise<void>
): Migration {
  return {
    name,
    up: upFn,
    down: downFn,
  };
}

/**
 * Create a SQL migration
 * @param name Migration name
 * @param upSql SQL to apply the migration
 * @param downSql SQL to rollback the migration
 * @returns Migration object
 */
export function createSqlMigration(
  name: string,
  upSql: string,
  downSql: string
): Migration {
  return {
    name,
    up: async (client: SupabaseClient<Database>) => {
      const { error } = await client.rpc('exec_sql', { sql: upSql });
      
      if (error) {
        throw error;
      }
    },
    down: async (client: SupabaseClient<Database>) => {
      const { error } = await client.rpc('exec_sql', { sql: downSql });
      
      if (error) {
        throw error;
      }
    },
  };
}

/**
 * Create a migration from a file
 * @param name Migration name
 * @param upFilePath Path to the SQL file for applying the migration
 * @param downFilePath Path to the SQL file for rolling back the migration
 * @returns Migration object
 */
export function createFileMigration(
  name: string,
  upFilePath: string,
  downFilePath: string
): Migration {
  return {
    name,
    up: async (client: SupabaseClient<Database>) => {
      const fs = require('fs');
      const upSql = fs.readFileSync(upFilePath, 'utf8');
      
      const { error } = await client.rpc('exec_sql', { sql: upSql });
      
      if (error) {
        throw error;
      }
    },
    down: async (client: SupabaseClient<Database>) => {
      const fs = require('fs');
      const downSql = fs.readFileSync(downFilePath, 'utf8');
      
      const { error } = await client.rpc('exec_sql', { sql: downSql });
      
      if (error) {
        throw error;
      }
    },
  };
}
