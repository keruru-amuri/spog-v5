// Script to export data from Supabase using Node.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create output directory
const outputDir = path.join(__dirname, '..', 'db_export');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Tables to export
const tables = [
  'users',
  'inventory_items',
  'consumption_records',
  'departments',
  'categories',
  'locations',
  'units_of_measure'
];

// Special case for auth.users table
async function exportAuthUsers() {
  console.log('Exporting auth.users table...');

  try {
    // Get users from auth.users view
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error exporting auth.users:', error);
      return;
    }

    if (!data || !data.users || data.users.length === 0) {
      console.log('No data found in auth.users');
      return;
    }

    // Save data to file
    fs.writeFileSync(
      path.join(outputDir, 'auth_users.json'),
      JSON.stringify(data.users, null, 2)
    );

    console.log(`Exported ${data.users.length} rows from auth.users`);
  } catch (error) {
    console.error('Error exporting auth.users:', error);
  }
}

// Export data from a table
async function exportTable(tableName) {
  console.log(`Exporting table: ${tableName}`);

  try {
    // Get table structure
    const { data: columns, error: columnsError } = await supabase
      .from(tableName)
      .select('*')
      .limit(0);

    if (columnsError) {
      console.error(`Error getting columns for ${tableName}:`, columnsError);

      // Create empty file for missing tables
      fs.writeFileSync(
        path.join(outputDir, `${tableName}.json`),
        JSON.stringify([], null, 2)
      );
      console.log(`Created empty file for ${tableName}`);
      return;
    }

    // Get table data
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`Error exporting ${tableName}:`, error);
      return;
    }

    if (!data || data.length === 0) {
      console.log(`No data found in table ${tableName}`);
      // Save empty array to file
      fs.writeFileSync(
        path.join(outputDir, `${tableName}.json`),
        JSON.stringify([], null, 2)
      );
      return;
    }

    // Save data to file
    fs.writeFileSync(
      path.join(outputDir, `${tableName}.json`),
      JSON.stringify(data, null, 2)
    );

    console.log(`Exported ${data.length} rows from ${tableName}`);
  } catch (error) {
    console.error(`Error exporting ${tableName}:`, error);
  }
}

// Export schema information
async function exportSchema() {
  console.log('Exporting schema information...');

  try {
    // Get list of tables
    const { data, error } = await supabase
      .rpc('get_tables');

    if (error) {
      console.error('Error getting tables:', error);
      return;
    }

    // Save schema information to file
    fs.writeFileSync(
      path.join(outputDir, 'schema_info.json'),
      JSON.stringify(data, null, 2)
    );

    console.log('Schema information exported');
  } catch (error) {
    console.error('Error exporting schema:', error);
  }
}

// Main function
async function main() {
  try {
    // Export schema
    await exportSchema();

    // Export auth users
    await exportAuthUsers();

    // Export each table
    for (const table of tables) {
      await exportTable(table);
    }

    console.log('Export completed successfully');
  } catch (error) {
    console.error('Error during export:', error);
  }
}

// Run the main function
main();
