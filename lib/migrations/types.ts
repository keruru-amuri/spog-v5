import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';

/**
 * Migration interface
 * Defines the structure of a migration
 */
export interface Migration {
  /**
   * Name of the migration
   * Should be unique and follow the format: YYYYMMDDHHMMSS_description
   * Example: 20230101120000_create_users_table
   */
  name: string;
  
  /**
   * Apply the migration
   * @param client Supabase client
   * @returns Promise resolving to void
   */
  up(client: SupabaseClient<Database>): Promise<void>;
  
  /**
   * Rollback the migration
   * @param client Supabase client
   * @returns Promise resolving to void
   */
  down(client: SupabaseClient<Database>): Promise<void>;
}

/**
 * Migration record interface
 * Represents a record in the migrations table
 */
export interface MigrationRecord {
  id: string;
  name: string;
  batch: number;
  migration_time: string;
  status: MigrationStatus;
}

/**
 * Migration status enum
 */
export enum MigrationStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Migration options interface
 */
export interface MigrationOptions {
  /**
   * Directory containing migration files
   * Default: db/migrations
   */
  migrationsDir?: string;
  
  /**
   * Whether to run migrations in a transaction
   * Default: true
   */
  useTransaction?: boolean;
  
  /**
   * Whether to log migration operations
   * Default: true
   */
  logging?: boolean;
}

/**
 * Migration result interface
 */
export interface MigrationResult {
  /**
   * Name of the migration
   */
  name: string;
  
  /**
   * Status of the migration
   */
  status: MigrationStatus;
  
  /**
   * Error message if the migration failed
   */
  error?: string;
}

/**
 * Migration batch result interface
 */
export interface MigrationBatchResult {
  /**
   * Batch number
   */
  batch: number;
  
  /**
   * Number of migrations applied
   */
  migrationsApplied: number;
  
  /**
   * Number of migrations failed
   */
  migrationsFailed: number;
  
  /**
   * Results of individual migrations
   */
  results: MigrationResult[];
}
