import { MigrationManager } from './migration-manager';
import { MigrationOptions, MigrationStatus } from './types';
import path from 'path';
import fs from 'fs';

/**
 * Migration CLI
 * Command-line interface for running migrations
 */
export class MigrationCli {
  private manager: MigrationManager;
  
  /**
   * Create a new migration CLI
   * @param options Migration options
   */
  constructor(options?: MigrationOptions) {
    this.manager = new MigrationManager(options);
  }
  
  /**
   * Run the CLI
   * @param args Command-line arguments
   * @returns Promise resolving to void
   */
  async run(args: string[] = process.argv.slice(2)): Promise<void> {
    try {
      // Load migrations
      await this.manager.loadFromFiles();
      
      // Parse command
      const command = args[0] || 'help';
      
      switch (command) {
        case 'up':
          await this.up();
          break;
        case 'down':
          await this.down();
          break;
        case 'reset':
          await this.reset();
          break;
        case 'refresh':
          await this.refresh();
          break;
        case 'status':
          await this.status();
          break;
        case 'create':
          await this.create(args[1]);
          break;
        case 'help':
        default:
          this.help();
          break;
      }
    } catch (error) {
      console.error('Error running migration CLI:', error);
      process.exit(1);
    }
  }
  
  /**
   * Apply pending migrations
   * @returns Promise resolving to void
   */
  private async up(): Promise<void> {
    console.log('Applying pending migrations...');
    
    const result = await this.manager.up();
    
    console.log(`Applied ${result.migrationsApplied} migrations, failed ${result.migrationsFailed} migrations`);
    
    if (result.results.length > 0) {
      console.log('Results:');
      
      for (const migrationResult of result.results) {
        console.log(`- ${migrationResult.name}: ${migrationResult.status}`);
        
        if (migrationResult.error) {
          console.log(`  Error: ${migrationResult.error}`);
        }
      }
    }
  }
  
  /**
   * Rollback the last batch of migrations
   * @returns Promise resolving to void
   */
  private async down(): Promise<void> {
    console.log('Rolling back the last batch of migrations...');
    
    const result = await this.manager.down();
    
    console.log(`Rolled back ${result.migrationsApplied} migrations, failed ${result.migrationsFailed} migrations`);
    
    if (result.results.length > 0) {
      console.log('Results:');
      
      for (const migrationResult of result.results) {
        console.log(`- ${migrationResult.name}: ${migrationResult.status}`);
        
        if (migrationResult.error) {
          console.log(`  Error: ${migrationResult.error}`);
        }
      }
    }
  }
  
  /**
   * Rollback all migrations
   * @returns Promise resolving to void
   */
  private async reset(): Promise<void> {
    console.log('Rolling back all migrations...');
    
    const results = await this.manager.reset();
    
    console.log(`Rolled back ${results.length} batches of migrations`);
    
    for (const result of results) {
      console.log(`Batch ${result.batch}: ${result.migrationsApplied} rolled back, ${result.migrationsFailed} failed`);
    }
  }
  
  /**
   * Refresh migrations (rollback all and apply again)
   * @returns Promise resolving to void
   */
  private async refresh(): Promise<void> {
    console.log('Refreshing migrations...');
    
    const result = await this.manager.refresh();
    
    console.log(`Applied ${result.migrationsApplied} migrations, failed ${result.migrationsFailed} migrations`);
    
    if (result.results.length > 0) {
      console.log('Results:');
      
      for (const migrationResult of result.results) {
        console.log(`- ${migrationResult.name}: ${migrationResult.status}`);
        
        if (migrationResult.error) {
          console.log(`  Error: ${migrationResult.error}`);
        }
      }
    }
  }
  
  /**
   * Show migration status
   * @returns Promise resolving to void
   */
  private async status(): Promise<void> {
    console.log('Migration status:');
    
    // Get all migrations
    const migrations = this.manager.getMigrations();
    
    // Get applied migrations
    const appliedMigrations = await this.manager.getAppliedMigrations();
    const appliedMigrationMap = new Map(appliedMigrations.map(m => [m.name, m]));
    
    // Get pending migrations
    const pendingMigrations = await this.manager.getPendingMigrations();
    const pendingMigrationNames = pendingMigrations.map(m => m.name);
    
    console.log(`Total migrations: ${migrations.length}`);
    console.log(`Applied migrations: ${appliedMigrations.length}`);
    console.log(`Pending migrations: ${pendingMigrations.length}`);
    
    if (appliedMigrations.length > 0) {
      console.log('\nApplied migrations:');
      
      for (const migration of appliedMigrations) {
        console.log(`- ${migration.name} (${migration.status}, batch ${migration.batch})`);
      }
    }
    
    if (pendingMigrations.length > 0) {
      console.log('\nPending migrations:');
      
      for (const migration of pendingMigrations) {
        console.log(`- ${migration.name}`);
      }
    }
    
    // Check for migrations that are in the database but not in the code
    const missingMigrations = appliedMigrations.filter(m => !migrations.some(migration => migration.name === m.name));
    
    if (missingMigrations.length > 0) {
      console.log('\nWarning: The following migrations are in the database but not in the code:');
      
      for (const migration of missingMigrations) {
        console.log(`- ${migration.name} (${migration.status}, batch ${migration.batch})`);
      }
    }
  }
  
  /**
   * Create a new migration
   * @param name Migration name
   * @returns Promise resolving to void
   */
  private async create(name?: string): Promise<void> {
    if (!name) {
      console.error('Error: Migration name is required');
      console.log('Usage: npm run migrate create <name>');
      process.exit(1);
    }
    
    // Generate migration name with timestamp
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const migrationName = `${timestamp}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    // Create migration directory if it doesn't exist
    const migrationsDir = path.join(process.cwd(), 'db', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    // Create migration file
    const migrationFile = path.join(migrationsDir, `${migrationName}.ts`);
    
    const migrationContent = `import { createMigration } from '../../lib/migrations/migration-factory';

/**
 * Migration: ${name}
 */
export default createMigration(
  '${migrationName}',
  async (client) => {
    // Apply migration
    const { error } = await client.rpc('exec_sql', {
      sql: \`
        -- Your SQL here
      \`,
    });
    
    if (error) {
      throw error;
    }
  },
  async (client) => {
    // Rollback migration
    const { error } = await client.rpc('exec_sql', {
      sql: \`
        -- Your rollback SQL here
      \`,
    });
    
    if (error) {
      throw error;
    }
  }
);
`;
    
    fs.writeFileSync(migrationFile, migrationContent);
    
    console.log(`Created migration: ${migrationFile}`);
  }
  
  /**
   * Show help
   */
  private help(): void {
    console.log('Migration CLI');
    console.log('Usage: npm run migrate <command>');
    console.log('\nCommands:');
    console.log('  up        Apply pending migrations');
    console.log('  down      Rollback the last batch of migrations');
    console.log('  reset     Rollback all migrations');
    console.log('  refresh   Rollback all migrations and apply them again');
    console.log('  status    Show migration status');
    console.log('  create    Create a new migration');
    console.log('  help      Show this help message');
  }
}
