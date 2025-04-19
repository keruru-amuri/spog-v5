import fs from 'fs';
import path from 'path';
import { supabase, connectionManager } from '../lib/supabase';
import { validateConfig } from '../lib/config';

/**
 * Execute SQL migrations in Supabase
 */
async function executeMigrations() {
  try {
    // Validate configuration
    validateConfig();
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      
      // Read the SQL file
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error executing migration ${file}:`, error);
        throw error;
      }
      
      console.log(`Successfully executed migration: ${file}`);
    }
    
    console.log('All migrations executed successfully');
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exit(1);
  }
}

// Execute migrations
executeMigrations();
