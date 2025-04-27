// Script to test connection to Azure PostgreSQL
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

// Log connection details (without password)
console.log('Connecting to Azure PostgreSQL with:', {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  ssl: true
});

async function testConnection() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to Azure PostgreSQL successfully!');
    
    // Test query - get all locations
    const result = await client.query('SELECT * FROM locations');
    console.log('Locations:', result.rows);
    
    // Test query - get all inventory items
    const itemsResult = await client.query('SELECT id, name, category, current_balance, unit FROM inventory_items LIMIT 5');
    console.log('Inventory Items:', itemsResult.rows);
    
    console.log('\nConnection test completed successfully');
  } catch (error) {
    console.error('Error during connection test:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection().catch(err => {
  console.error('Connection test failed:', err);
  process.exit(1);
});
