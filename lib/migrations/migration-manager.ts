import fs from 'fs';
import path from 'path';
import { connectionManager } from '../supabase';
import { 
  Migration, 
  MigrationOptions, 
  MigrationRecord, 
  MigrationStatus, 
  MigrationResult, 
  MigrationBatchResult 
} from './types';

/**
 * Migration manager
 * Manages database migrations
 */
export class MigrationManager {
  private options: Required<MigrationOptions>;
  private migrations: Migration[] = [];
  
  /**
   * Create a new migration manager
   * @param options Migration options
   */
  constructor(options?: MigrationOptions) {
    this.options = {
      migrationsDir: options?.migrationsDir || path.join(process.cwd(), 'db', 'migrations'),
      useTransaction: options?.useTransaction !== undefined ? options.useTransaction : true,
      logging: options?.logging !== undefined ? options.logging : true,
    };
  }
  
  /**
   * Initialize the migration manager
   * Creates the migrations table if it doesn't exist
   * @returns Promise resolving to void
   */
  async initialize(): Promise<void> {
    try {
      this.log('Initializing migration manager');
      
      // Check if migrations table exists
      const { data, error } = await connectionManager.getClient()
        .from('migrations')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        this.log('Creating migrations table');
        
        const createTableSql = fs.readFileSync(
          path.join(this.options.migrationsDir, '08_create_migrations_table.sql'),
          'utf8'
        );
        
        await connectionManager.executeWithRetry(async (client) => {
          const { error } = await client.rpc('exec_sql', { sql: createTableSql });
          
          if (error) {
            throw error;
          }
        });
        
        this.log('Migrations table created successfully');
      } else if (error) {
        throw error;
      }
    } catch (error) {
      this.log('Error initializing migration manager:', error);
      throw error;
    }
  }
  
  /**
   * Register a migration
   * @param migration Migration to register
   * @returns Migration manager instance for chaining
   */
  register(migration: Migration): MigrationManager {
    this.migrations.push(migration);
    return this;
  }
  
  /**
   * Register multiple migrations
   * @param migrations Migrations to register
   * @returns Migration manager instance for chaining
   */
  registerMany(migrations: Migration[]): MigrationManager {
    this.migrations.push(...migrations);
    return this;
  }
  
  /**
   * Load migrations from files
   * @param dir Directory containing migration files
   * @returns Promise resolving to migration manager instance for chaining
   */
  async loadFromFiles(dir?: string): Promise<MigrationManager> {
    try {
      const migrationsDir = dir || this.options.migrationsDir;
      
      this.log(`Loading migrations from ${migrationsDir}`);
      
      // Get all JavaScript and TypeScript files in the migrations directory
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
        .filter(file => !file.endsWith('.d.ts')) // Exclude declaration files
        .filter(file => !file.endsWith('.test.js') && !file.endsWith('.test.ts')) // Exclude test files
        .sort();
      
      this.log(`Found ${files.length} migration files`);
      
      // Load each migration file
      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        
        try {
          // Import the migration file
          const migration = require(filePath);
          
          // Check if the file exports a default migration
          if (migration.default && typeof migration.default.up === 'function' && typeof migration.default.down === 'function') {
            this.register(migration.default);
          }
          // Check if the file exports a named migration
          else if (typeof migration.up === 'function' && typeof migration.down === 'function') {
            this.register(migration);
          }
          else {
            this.log(`Skipping ${file}: Not a valid migration`);
          }
        } catch (error) {
          this.log(`Error loading migration ${file}:`, error);
          throw error;
        }
      }
      
      return this;
    } catch (error) {
      this.log('Error loading migrations from files:', error);
      throw error;
    }
  }
  
  /**
   * Get all registered migrations
   * @returns Array of registered migrations
   */
  getMigrations(): Migration[] {
    return [...this.migrations];
  }
  
  /**
   * Get all applied migrations
   * @returns Promise resolving to array of applied migration records
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      const { data, error } = await connectionManager.getClient()
        .from('migrations')
        .select('*')
        .order('migration_time', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return data as MigrationRecord[];
    } catch (error) {
      this.log('Error getting applied migrations:', error);
      throw error;
    }
  }
  
  /**
   * Get pending migrations
   * @returns Promise resolving to array of pending migrations
   */
  async getPendingMigrations(): Promise<Migration[]> {
    try {
      // Get all applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      const appliedMigrationNames = appliedMigrations.map(m => m.name);
      
      // Filter out applied migrations
      return this.migrations.filter(m => !appliedMigrationNames.includes(m.name));
    } catch (error) {
      this.log('Error getting pending migrations:', error);
      throw error;
    }
  }
  
  /**
   * Get the latest batch number
   * @returns Promise resolving to the latest batch number
   */
  async getLatestBatch(): Promise<number> {
    try {
      const { data, error } = await connectionManager.getClient()
        .from('migrations')
        .select('batch')
        .order('batch', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      return data.length > 0 ? data[0].batch : 0;
    } catch (error) {
      this.log('Error getting latest batch:', error);
      throw error;
    }
  }
  
  /**
   * Apply pending migrations
   * @returns Promise resolving to migration batch result
   */
  async up(): Promise<MigrationBatchResult> {
    try {
      // Initialize the migration manager
      await this.initialize();
      
      // Get pending migrations
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        this.log('No pending migrations to apply');
        return {
          batch: await this.getLatestBatch(),
          migrationsApplied: 0,
          migrationsFailed: 0,
          results: [],
        };
      }
      
      this.log(`Applying ${pendingMigrations.length} pending migrations`);
      
      // Get the next batch number
      const batch = await this.getLatestBatch() + 1;
      
      // Apply each migration
      const results: MigrationResult[] = [];
      let migrationsApplied = 0;
      let migrationsFailed = 0;
      
      for (const migration of pendingMigrations) {
        try {
          this.log(`Applying migration: ${migration.name}`);
          
          // Apply the migration
          if (this.options.useTransaction) {
            await connectionManager.executeWithRetry(async (client) => {
              // Start a transaction
              await client.rpc('exec_sql', { sql: 'BEGIN;' });
              
              try {
                // Apply the migration
                await migration.up(client);
                
                // Record the migration
                const { error } = await client
                  .from('migrations')
                  .insert({
                    name: migration.name,
                    batch,
                    status: MigrationStatus.APPLIED,
                  });
                
                if (error) {
                  throw error;
                }
                
                // Commit the transaction
                await client.rpc('exec_sql', { sql: 'COMMIT;' });
              } catch (error) {
                // Rollback the transaction
                await client.rpc('exec_sql', { sql: 'ROLLBACK;' });
                throw error;
              }
            });
          } else {
            // Apply the migration without a transaction
            await connectionManager.executeWithRetry(async (client) => {
              // Apply the migration
              await migration.up(client);
              
              // Record the migration
              const { error } = await client
                .from('migrations')
                .insert({
                  name: migration.name,
                  batch,
                  status: MigrationStatus.APPLIED,
                });
              
              if (error) {
                throw error;
              }
            });
          }
          
          this.log(`Migration applied successfully: ${migration.name}`);
          
          results.push({
            name: migration.name,
            status: MigrationStatus.APPLIED,
          });
          
          migrationsApplied++;
        } catch (error) {
          this.log(`Error applying migration ${migration.name}:`, error);
          
          // Record the failed migration
          await connectionManager.getClient()
            .from('migrations')
            .insert({
              name: migration.name,
              batch,
              status: MigrationStatus.FAILED,
            });
          
          results.push({
            name: migration.name,
            status: MigrationStatus.FAILED,
            error: error.message,
          });
          
          migrationsFailed++;
          
          // Stop applying migrations if one fails
          break;
        }
      }
      
      return {
        batch,
        migrationsApplied,
        migrationsFailed,
        results,
      };
    } catch (error) {
      this.log('Error applying migrations:', error);
      throw error;
    }
  }
  
  /**
   * Rollback the last batch of migrations
   * @returns Promise resolving to migration batch result
   */
  async down(): Promise<MigrationBatchResult> {
    try {
      // Initialize the migration manager
      await this.initialize();
      
      // Get the latest batch
      const batch = await this.getLatestBatch();
      
      if (batch === 0) {
        this.log('No migrations to rollback');
        return {
          batch: 0,
          migrationsApplied: 0,
          migrationsFailed: 0,
          results: [],
        };
      }
      
      // Get migrations from the latest batch
      const { data, error } = await connectionManager.getClient()
        .from('migrations')
        .select('*')
        .eq('batch', batch)
        .eq('status', MigrationStatus.APPLIED)
        .order('migration_time', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const migrationsToRollback = data as MigrationRecord[];
      
      if (migrationsToRollback.length === 0) {
        this.log(`No migrations to rollback in batch ${batch}`);
        return {
          batch,
          migrationsApplied: 0,
          migrationsFailed: 0,
          results: [],
        };
      }
      
      this.log(`Rolling back ${migrationsToRollback.length} migrations from batch ${batch}`);
      
      // Rollback each migration
      const results: MigrationResult[] = [];
      let migrationsApplied = 0;
      let migrationsFailed = 0;
      
      for (const migrationRecord of migrationsToRollback) {
        try {
          this.log(`Rolling back migration: ${migrationRecord.name}`);
          
          // Find the migration
          const migration = this.migrations.find(m => m.name === migrationRecord.name);
          
          if (!migration) {
            throw new Error(`Migration ${migrationRecord.name} not found`);
          }
          
          // Rollback the migration
          if (this.options.useTransaction) {
            await connectionManager.executeWithRetry(async (client) => {
              // Start a transaction
              await client.rpc('exec_sql', { sql: 'BEGIN;' });
              
              try {
                // Rollback the migration
                await migration.down(client);
                
                // Update the migration record
                const { error } = await client
                  .from('migrations')
                  .update({ status: MigrationStatus.ROLLED_BACK })
                  .eq('id', migrationRecord.id);
                
                if (error) {
                  throw error;
                }
                
                // Commit the transaction
                await client.rpc('exec_sql', { sql: 'COMMIT;' });
              } catch (error) {
                // Rollback the transaction
                await client.rpc('exec_sql', { sql: 'ROLLBACK;' });
                throw error;
              }
            });
          } else {
            // Rollback the migration without a transaction
            await connectionManager.executeWithRetry(async (client) => {
              // Rollback the migration
              await migration.down(client);
              
              // Update the migration record
              const { error } = await client
                .from('migrations')
                .update({ status: MigrationStatus.ROLLED_BACK })
                .eq('id', migrationRecord.id);
              
              if (error) {
                throw error;
              }
            });
          }
          
          this.log(`Migration rolled back successfully: ${migrationRecord.name}`);
          
          results.push({
            name: migrationRecord.name,
            status: MigrationStatus.ROLLED_BACK,
          });
          
          migrationsApplied++;
        } catch (error) {
          this.log(`Error rolling back migration ${migrationRecord.name}:`, error);
          
          // Update the migration record
          await connectionManager.getClient()
            .from('migrations')
            .update({ status: MigrationStatus.FAILED })
            .eq('id', migrationRecord.id);
          
          results.push({
            name: migrationRecord.name,
            status: MigrationStatus.FAILED,
            error: error.message,
          });
          
          migrationsFailed++;
          
          // Stop rolling back migrations if one fails
          break;
        }
      }
      
      return {
        batch,
        migrationsApplied,
        migrationsFailed,
        results,
      };
    } catch (error) {
      this.log('Error rolling back migrations:', error);
      throw error;
    }
  }
  
  /**
   * Rollback all migrations
   * @returns Promise resolving to migration batch result
   */
  async reset(): Promise<MigrationBatchResult[]> {
    try {
      // Initialize the migration manager
      await this.initialize();
      
      // Get all batches
      const { data, error } = await connectionManager.getClient()
        .from('migrations')
        .select('batch')
        .eq('status', MigrationStatus.APPLIED)
        .order('batch', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Get unique batch numbers
      const batches = [...new Set(data.map(m => m.batch))];
      
      if (batches.length === 0) {
        this.log('No migrations to reset');
        return [];
      }
      
      this.log(`Resetting ${batches.length} batches of migrations`);
      
      // Rollback each batch
      const results: MigrationBatchResult[] = [];
      
      for (const batch of batches) {
        const result = await this.down();
        results.push(result);
      }
      
      return results;
    } catch (error) {
      this.log('Error resetting migrations:', error);
      throw error;
    }
  }
  
  /**
   * Refresh migrations (rollback all and apply again)
   * @returns Promise resolving to migration batch result
   */
  async refresh(): Promise<MigrationBatchResult> {
    try {
      // Reset all migrations
      await this.reset();
      
      // Apply all migrations
      return await this.up();
    } catch (error) {
      this.log('Error refreshing migrations:', error);
      throw error;
    }
  }
  
  /**
   * Log a message if logging is enabled
   * @param message Message to log
   * @param args Additional arguments to log
   */
  private log(message: string, ...args: any[]): void {
    if (this.options.logging) {
      console.log(`[MigrationManager] ${message}`, ...args);
    }
  }
}
