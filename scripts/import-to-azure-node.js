// Script to import data to Azure PostgreSQL using Node.js
require('dotenv').config({ path: '.env.azure' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

// Check if db_export directory exists
const exportDir = path.join(__dirname, '..', 'db_export');
if (!fs.existsSync(exportDir)) {
  console.error('Error: db_export directory not found. Run export-supabase-node.js first.');
  process.exit(1);
}

// Tables to import (in order to handle foreign key constraints)
const tables = [
  'users',
  'departments',
  'categories',
  'locations',
  'units_of_measure',
  'inventory_items',
  'consumption_records'
];

// Import data for a table
async function importTable(tableName, client) {
  console.log(`Importing table: ${tableName}`);

  try {
    // Read data from file
    const dataFile = path.join(exportDir, `${tableName}.json`);
    if (!fs.existsSync(dataFile)) {
      console.error(`Error: Data file for ${tableName} not found`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

    if (!data || data.length === 0) {
      console.log(`No data to import for ${tableName}`);
      return;
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);

    // Clear existing data
    await client.query(`DELETE FROM ${tableName}`);

    // Import data in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      // Create placeholders for values
      const placeholders = batch.map((_, rowIndex) => {
        return `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`;
      }).join(', ');

      // Create values array
      const values = [];
      batch.forEach(row => {
        columns.forEach(col => {
          values.push(row[col]);
        });
      });

      // Insert data
      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${placeholders}
      `;

      await client.query(query, values);
    }

    console.log(`Imported ${data.length} rows into ${tableName}`);
  } catch (error) {
    console.error(`Error importing ${tableName}:`, error);
  }
}

// Create tables if they don't exist
async function createTables(client) {
  console.log('Creating tables if they don\'t exist...');

  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        password_hash VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        department VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login TIMESTAMP WITH TIME ZONE,
        profile_image_url TEXT,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP WITH TIME ZONE
      )
    `);

    // Create departments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // Create locations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // Create units_of_measure table
    await client.query(`
      CREATE TABLE IF NOT EXISTS units_of_measure (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        name VARCHAR(255) NOT NULL UNIQUE,
        abbreviation VARCHAR(50),
        conversion_factor DECIMAL(10, 4) DEFAULT 1.0,
        base_unit_id UUID REFERENCES units_of_measure(id)
      )
    `);

    // Create inventory_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        name VARCHAR(255) NOT NULL,
        category VARCHAR(255),
        location_id UUID REFERENCES locations(id),
        current_balance DECIMAL(10, 2) NOT NULL,
        original_amount DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(50),
        consumption_unit VARCHAR(50),
        status VARCHAR(50),
        description TEXT,
        last_refilled TIMESTAMP WITH TIME ZONE,
        image_url TEXT,
        batch_number VARCHAR(255),
        minimum_quantity DECIMAL(10, 2),
        expiry_date DATE
      )
    `);

    // Create consumption_records table
    await client.query(`
      CREATE TABLE IF NOT EXISTS consumption_records (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        inventory_item_id UUID REFERENCES inventory_items(id),
        user_id UUID REFERENCES users(id),
        quantity DECIMAL(10, 2) NOT NULL,
        unit VARCHAR(50),
        notes TEXT,
        recorded_at TIMESTAMP WITH TIME ZONE
      )
    `);

    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Main function
async function main() {
  const client = await pool.connect();

  try {
    // Create tables (outside transaction to avoid rollback if one table fails)
    await createTables(client);

    // Import each table separately (not in a single transaction)
    for (const table of tables) {
      const tableClient = await pool.connect();
      try {
        // Begin transaction for this table
        await tableClient.query('BEGIN');

        // Import table
        await importTable(table, tableClient);

        // Commit transaction
        await tableClient.query('COMMIT');
      } catch (error) {
        // Rollback transaction on error
        await tableClient.query('ROLLBACK');
        console.error(`Error importing table ${table}:`, error);
      } finally {
        // Release client
        tableClient.release();
      }
    }

    console.log('Import completed successfully');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    // Release client
    client.release();

    // Close pool
    await pool.end();
  }
}

// Run the main function
main();
