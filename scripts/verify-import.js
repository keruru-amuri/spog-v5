// Script to verify the imported data in Azure PostgreSQL
require('dotenv').config({ path: '.env.azure' });
const { Pool } = require('pg');

// Azure PostgreSQL connection details
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'spog-inventory-db.postgres.database.azure.com',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'spogadmin',
  password: process.env.POSTGRES_PASSWORD,
  ssl: {
    rejectUnauthorized: false // Required for Azure PostgreSQL
  }
});

// Tables to verify
const tables = [
  'users',
  'departments',
  'categories',
  'locations',
  'units_of_measure',
  'inventory_items',
  'consumption_records'
];

// Main function
async function main() {
  const client = await pool.connect();
  
  try {
    console.log('Verifying imported data...');
    
    // Check counts for each table
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
      }
    }
    
    // Check some sample data
    console.log('\nSample data:');
    
    // Sample users
    const users = await client.query('SELECT id, email, first_name, last_name, role FROM users LIMIT 3');
    console.log('Users:', JSON.stringify(users.rows, null, 2));
    
    // Sample inventory items
    const items = await client.query('SELECT id, name, category, current_balance, unit FROM inventory_items LIMIT 3');
    console.log('Inventory Items:', JSON.stringify(items.rows, null, 2));
    
    // Sample consumption records
    const records = await client.query('SELECT id, inventory_item_id, user_id, quantity, unit FROM consumption_records LIMIT 3');
    console.log('Consumption Records:', JSON.stringify(records.rows, null, 2));
    
    console.log('\nVerification completed successfully');
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    // Release client
    client.release();
    
    // Close pool
    await pool.end();
  }
}

// Run the main function
main();
