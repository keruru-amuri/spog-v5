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
    
    // Test query
    const result = await client.query('SELECT current_timestamp as time, current_database() as database');
    console.log('Database info:', result.rows[0]);
    
    // Test tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\nAvailable tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Test data
    console.log('\nSample data:');
    const usersCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Users: ${usersCount.rows[0].count}`);
    
    const itemsCount = await client.query('SELECT COUNT(*) FROM inventory_items');
    console.log(`Inventory Items: ${itemsCount.rows[0].count}`);
    
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
