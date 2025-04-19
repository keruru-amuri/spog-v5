// A simplified script to directly execute SQL migrations
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Execute SQL migrations in Supabase
 */
async function executeMigrations() {
  try {
    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure correct order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // First, create the exec_sql function
    console.log('Creating exec_sql function...');
    
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    try {
      const { error: createFunctionError } = await supabase.rpc('exec_sql', { sql: createFunctionSql });
      
      if (createFunctionError) {
        console.log('Function may not exist yet, trying direct SQL...');
        // We'll continue and try to execute the migrations directly
      }
    } catch (error) {
      console.log('Error creating function, will try direct SQL:', error.message);
      // We'll continue and try to execute the migrations directly
    }
    
    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Executing migration: ${file}`);
      
      // Read the SQL file
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Split the SQL into statements
      const statements = sql.split(';').filter(statement => statement.trim().length > 0);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        
        if (statement.length === 0) {
          continue;
        }
        
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        
        try {
          // Try to execute using the exec_sql RPC
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.error(`Error executing statement using RPC:`, error);
            
            // Try using the REST API to execute SQL
            console.log('Trying to execute using REST API...');
            
            // This is a simplified approach and may not work for all SQL statements
            // In a real-world scenario, you would need to use the Supabase Management API
            // or connect directly to the database using a PostgreSQL client
            
            console.error('Cannot execute SQL directly via REST API. Please use the Supabase dashboard to execute the SQL.');
            console.log('SQL statement:');
            console.log(statement);
            
            // Ask the user if they want to continue
            const readline = require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            });
            
            await new Promise((resolve) => {
              readline.question('Press Enter to continue or Ctrl+C to abort...', () => {
                readline.close();
                resolve();
              });
            });
          }
        } catch (error) {
          console.error(`Error executing statement:`, error);
          
          // Ask the user if they want to continue
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          await new Promise((resolve) => {
            readline.question('Press Enter to continue or Ctrl+C to abort...', () => {
              readline.close();
              resolve();
            });
          });
        }
      }
      
      console.log(`Finished processing migration: ${file}`);
    }
    
    console.log('All migrations processed');
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exit(1);
  }
}

// Execute migrations
executeMigrations();
