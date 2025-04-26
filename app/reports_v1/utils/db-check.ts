import { supabase } from '@/lib/supabase';

/**
 * Check if required tables exist in the Supabase database
 * @returns Promise resolving to an object with table existence status
 */
export async function checkRequiredTables() {
  try {
    console.log('Checking required tables...');

    const requiredTables = [
      'inventory_items',
      'consumption_records',
      'locations',
      'users'
    ];

    // Check each table individually by trying to select from it
    const tableStatus: Record<string, boolean> = {};

    // Initialize all tables as not existing
    requiredTables.forEach(table => {
      tableStatus[table] = false;
    });

    // Check if we can access the database at all
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error accessing Supabase:', error);
        return {
          success: false,
          error: 'Cannot access Supabase: ' + (error.message || 'Unknown error'),
          allTablesExist: false,
          tableStatus
        };
      }

      console.log('Supabase session check:', data ? 'Success' : 'No data');
    } catch (sessionErr) {
      console.error('Exception checking Supabase session:', sessionErr);
      return {
        success: false,
        error: 'Exception checking Supabase session: ' + (sessionErr instanceof Error ? sessionErr.message : String(sessionErr)),
        allTablesExist: false,
        tableStatus
      };
    }

    // Now check each table
    for (const tableName of requiredTables) {
      try {
        console.log(`Checking if table '${tableName}' exists...`);

        // Use a simpler approach - just try to get one row
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        // If no error, the table exists
        const exists = !error;
        tableStatus[tableName] = exists;
        console.log(`Table '${tableName}' exists:`, exists);

        if (error) {
          // Log error details but don't throw
          console.log(`Error details for '${tableName}':`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
        }
      } catch (tableErr) {
        console.error(`Exception checking table '${tableName}':`, tableErr);
        // Table already marked as false
      }
    }

    return {
      success: true,
      allTablesExist: Object.values(tableStatus).every(exists => exists),
      tableStatus
    };
  } catch (err) {
    console.error('Error checking required tables:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      allTablesExist: false,
      tableStatus: {}
    };
  }
}

/**
 * Get table row counts for all required tables
 * @returns Promise resolving to an object with table row counts
 */
export async function getTableRowCounts() {
  try {
    console.log('Getting table row counts...');

    const tables = [
      'inventory_items',
      'consumption_records',
      'locations',
      'users'
    ];

    const counts: Record<string, number> = {};

    // Initialize all counts to -1 (error/not available)
    tables.forEach(table => {
      counts[table] = -1;
    });

    // Check if we can access the database at all
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error accessing Supabase:', error);
        return {
          success: false,
          error: 'Cannot access Supabase: ' + (error.message || 'Unknown error'),
          counts
        };
      }
    } catch (sessionErr) {
      console.error('Exception checking Supabase session:', sessionErr);
      return {
        success: false,
        error: 'Exception checking Supabase session: ' + (sessionErr instanceof Error ? sessionErr.message : String(sessionErr)),
        counts
      };
    }

    // Get row counts for each table
    for (const table of tables) {
      try {
        console.log(`Getting row count for table '${table}'...`);

        // Use a simpler approach first - check if table exists
        const { data: checkData, error: checkError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (checkError) {
          console.log(`Table '${table}' does not exist or is not accessible`);
          // Keep the default -1 count
          continue;
        }

        // Now get the count
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error(`Error getting row count for ${table}:`, error);
          // Keep the default -1 count
        } else {
          counts[table] = count || 0;
          console.log(`Table '${table}' has ${count || 0} rows`);
        }
      } catch (tableErr) {
        console.error(`Exception querying table ${table}:`, tableErr);
        // Keep the default -1 count
      }
    }

    console.log('Final row counts:', counts);
    return {
      success: true,
      counts
    };
  } catch (err) {
    console.error('Error getting table row counts:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      counts: {}
    };
  }
}
