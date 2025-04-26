import { supabase } from '@/lib/supabase';

// Define the expected schema for each table
const expectedSchema = {
  inventory_items: [
    'id',
    'name',
    'category',
    'current_balance',
    'original_amount',
    'unit',
    'status',
    'location_id',
    'created_at',
    'updated_at'
  ],
  consumption_records: [
    'id',
    'inventory_item_id',
    'user_id',
    'quantity',
    'unit',
    'recorded_at',
    'created_at'
  ],
  users: [
    'id',
    'email',
    // 'name', // Optional: not present in default Supabase auth schema
    'department',
    'role'
  ],
  locations: [
    'id',
    'name',
    'description'
  ]
};

/**
 * Checks if a table exists and has the expected columns
 * @param tableName The name of the table to check
 * @returns Object with validation results
 */
export async function validateTable(tableName: string): Promise<{
  exists: boolean;
  columns: string[];
  missingColumns: string[];
  error?: string;
}> {
  try {
    // Check if table exists by trying to select a single row
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error checking table ${tableName}:`, error);
      return {
        exists: false,
        columns: [],
        missingColumns: expectedSchema[tableName as keyof typeof expectedSchema] || [],
        error: error.message
      };
    }

    // Get column information
    let columns: string[] = [];

    if (data && data.length > 0) {
      // Extract column names from the first row
      columns = Object.keys(data[0]);
    } else {
      // If no data, try to get column info from the database
      const { data: columnData, error: columnError } = await supabase.rpc(
        'get_table_columns',
        { table_name: tableName }
      );

      if (columnError) {
        console.warn(`Could not get columns for ${tableName} using RPC:`, columnError);
        // We'll assume the table exists but we couldn't get column info
        columns = [];
      } else if (columnData) {
        columns = columnData.map((col: any) => col.column_name);
      }
    }

    // Check for missing columns
    const expectedColumns = expectedSchema[tableName as keyof typeof expectedSchema] || [];
    const missingColumns = expectedColumns.filter(col => !columns.includes(col));

    return {
      exists: true,
      columns,
      missingColumns
    };
  } catch (err) {
    console.error(`Exception validating table ${tableName}:`, err);
    return {
      exists: false,
      columns: [],
      missingColumns: expectedSchema[tableName as keyof typeof expectedSchema] || [],
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Validates all required tables and their schemas
 * @returns Validation results for all tables
 */
export async function validateDatabaseSchema(): Promise<{
  valid: boolean;
  tables: Record<string, {
    exists: boolean;
    columns: string[];
    missingColumns: string[];
    error?: string;
  }>;
}> {
  const tables = Object.keys(expectedSchema);
  const results: Record<string, any> = {};

  for (const table of tables) {
    results[table] = await validateTable(table);
  }

  // Schema is valid if all tables exist and have no missing columns
  const valid = Object.values(results).every(
    result => result.exists && result.missingColumns.length === 0
  );

  return {
    valid,
    tables: results
  };
}
