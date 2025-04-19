import { createMigration } from '../../lib/migrations/migration-factory';
import fs from 'fs';
import path from 'path';

/**
 * Migration: Create initial tables
 * This migration creates all the initial tables for the application
 */
export default createMigration(
  '20250419000100_create_initial_tables',
  async (client) => {
    // Apply migration
    const sqlFiles = [
      '01_create_locations_table.sql',
      '02_create_inventory_items_table.sql',
      '03_create_users_table.sql',
      '04_create_user_sessions_table.sql',
      '05_create_user_permissions_table.sql',
      '06_create_consumption_records_table.sql',
      '07_create_stored_procedures.sql',
    ];

    // Read and execute each SQL file
    for (const file of sqlFiles) {
      const filePath = path.join(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split the SQL into statements
      const statements = sql.split(';').filter(statement => statement.trim().length > 0);
      
      // Execute each statement
      for (const statement of statements) {
        const { error } = await client.rpc('exec_sql', {
          sql: statement.trim() + ';',
        });
        
        if (error) {
          throw new Error(`Error executing SQL from ${file}: ${error.message}`);
        }
      }
    }
  },
  async (client) => {
    // Rollback migration
    const { error } = await client.rpc('exec_sql', {
      sql: `
        -- Drop tables in reverse order to avoid foreign key constraints
        DROP TABLE IF EXISTS public.consumption_records;
        DROP TABLE IF EXISTS public.user_permissions;
        DROP TABLE IF EXISTS public.user_sessions;
        DROP TABLE IF EXISTS public.users;
        DROP TABLE IF EXISTS public.inventory_items;
        DROP TABLE IF EXISTS public.locations;
        
        -- Drop functions
        DROP FUNCTION IF EXISTS get_consumption_summary_by_item;
        DROP FUNCTION IF EXISTS get_consumption_summary_by_user;
        DROP FUNCTION IF EXISTS update_consumption_records_updated_at;
        DROP FUNCTION IF EXISTS update_inventory_item_after_consumption;
        DROP FUNCTION IF EXISTS update_user_permissions_updated_at;
        DROP FUNCTION IF EXISTS update_user_sessions_updated_at;
        DROP FUNCTION IF EXISTS invalidate_expired_sessions;
        DROP FUNCTION IF EXISTS update_users_updated_at;
        DROP FUNCTION IF EXISTS update_inventory_items_updated_at;
        DROP FUNCTION IF EXISTS update_inventory_items_status;
        DROP FUNCTION IF EXISTS update_locations_updated_at;
      `,
    });
    
    if (error) {
      throw error;
    }
  }
);
