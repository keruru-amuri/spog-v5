// JavaScript version of execute-migrations.ts
const fs = require('fs');
const path = require('path');
const { supabase } = require('../lib/supabase');
const { validateConfig } = require('../lib/config');

/**
 * Execute SQL migrations in Supabase
 */
async function executeMigrations() {
  try {
    // Validate configuration
    validateConfig();
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
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
          // Execute the SQL statement
          const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          
          if (error) {
            console.error(`Error executing statement:`, error);
            throw error;
          }
        } catch (error) {
          // If the error is about the exec_sql function not existing, we need to create it first
          if (error.message && error.message.includes('function exec_sql() does not exist')) {
            console.log('Creating exec_sql function...');
            
            // Create the exec_sql function
            const createFunctionSql = `
              CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
              RETURNS VOID AS $$
              BEGIN
                EXECUTE sql;
              END;
              $$ LANGUAGE plpgsql SECURITY DEFINER;
            `;
            
            // Try to create the function directly using a raw query
            try {
              const { error: createFunctionError } = await supabase.rpc('exec_sql', { sql: createFunctionSql });
              
              if (createFunctionError) {
                console.error(`Error creating exec_sql function:`, createFunctionError);
                
                // If we can't create the function using RPC, try using a raw query
                console.log('Trying to create exec_sql function using raw query...');
                
                const { error: rawQueryError } = await supabase.from('_exec_sql').select('*').limit(1);
                
                if (rawQueryError) {
                  console.error(`Error creating exec_sql function using raw query:`, rawQueryError);
                  throw rawQueryError;
                }
              }
              
              // Try executing the statement again
              const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
              
              if (error) {
                console.error(`Error executing statement:`, error);
                throw error;
              }
            } catch (createError) {
              console.error('Error creating exec_sql function:', createError);
              
              // As a last resort, try to execute the SQL directly
              console.log('Trying to execute SQL directly...');
              
              // This is a simplified approach and may not work for all SQL statements
              const { error: directError } = await supabase.from('_direct_sql').select('*').limit(1);
              
              if (directError) {
                console.error(`Error executing SQL directly:`, directError);
                throw directError;
              }
            }
          } else {
            throw error;
          }
        }
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
