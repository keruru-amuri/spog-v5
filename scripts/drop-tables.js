// Script to drop all tables in Azure PostgreSQL
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

// Tables to drop
const tables = [
  'consumption_records',
  'inventory_items',
  'units_of_measure',
  'locations',
  'categories',
  'departments',
  'users'
];

// Main function
async function main() {
  const client = await pool.connect();
  
  try {
    // Drop each table
    for (const table of tables) {
      try {
        console.log(`Dropping table: ${table}`);
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`Table ${table} dropped successfully`);
      } catch (error) {
        console.error(`Error dropping table ${table}:`, error);
      }
    }
    
    console.log('All tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
  } finally {
    // Release client
    client.release();
    
    // Close pool
    await pool.end();
  }
}

// Run the main function
main();
