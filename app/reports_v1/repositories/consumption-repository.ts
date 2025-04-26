import { supabase } from '@/lib/supabase';

export interface ConsumptionRecord {
  id: string;
  inventory_item_id: string;
  user_id: string;
  quantity: number;
  unit: string;
  recorded_at: string;
  created_at?: string;
  item_name?: string;
  user_email?: string;
  user_department?: string;
}

export interface ConsumptionSummary {
  date: string;
  total: number;
  records: number;
}

/**
 * Fetches consumption records with optional filtering
 * @param startDate Optional start date for filtering
 * @param endDate Optional end date for filtering
 * @param locationId Optional location ID for filtering
 * @returns Array of consumption records with item and user details
 */
export async function getConsumptionRecords(
  startDate?: Date,
  endDate?: Date,
  locationId?: string
): Promise<{ data: ConsumptionRecord[]; error: string | null }> {
  try {
    let query = supabase
      .from('consumption_records')
      .select(`
        *,
        inventory_items!inner (
          id,
          name,
          unit,
          location_id
        ),
        users (
          id,
          email,
          department
        )
      `)
      .order('recorded_at', { ascending: false });

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('recorded_at', startDate.toISOString());
    }

    if (endDate) {
      // Add one day to include the end date fully
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
      query = query.lt('recorded_at', adjustedEndDate.toISOString());
    }

    // Apply location filter if provided
    if (locationId) {
      console.log('Repository: Filtering consumption records by location:', locationId);
      // Use the inner join filter
      query = query.eq('inventory_items.location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching consumption records:', error);
      return { data: [], error: error.message };
    }

    // Transform data to match expected format
    const consumptionRecords: ConsumptionRecord[] = data.map(record => ({
      id: record.id,
      inventory_item_id: record.inventory_item_id,
      user_id: record.user_id,
      quantity: record.quantity,
      unit: record.unit || record.inventory_items?.unit || '',
      recorded_at: record.recorded_at,
      created_at: record.created_at,
      item_name: record.inventory_items?.name,
      user_email: record.users?.email,
      user_department: record.users?.department
    }));

    return { data: consumptionRecords, error: null };
  } catch (err) {
    console.error('Exception fetching consumption records:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Unknown error fetching consumption records'
    };
  }
}

/**
 * Generates daily consumption summaries for the given date range
 * @param startDate Start date for the summary
 * @param endDate End date for the summary
 * @param locationId Optional location ID for filtering
 * @returns Array of daily consumption summaries
 */
export async function getDailyConsumptionSummary(
  startDate: Date,
  endDate: Date,
  locationId?: string
): Promise<{ data: ConsumptionSummary[]; error: string | null }> {
  try {
    // Fetch consumption records for the date range and location
    const { data: records, error } = await getConsumptionRecords(startDate, endDate, locationId);

    if (error) {
      return { data: [], error };
    }

    // Create a map of dates to track daily consumption
    const dailyMap: Record<string, { total: number; records: number }> = {};

    // Generate all dates in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dailyMap[dateString] = { total: 0, records: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Aggregate consumption by date
    records.forEach(record => {
      const recordDate = new Date(record.recorded_at).toISOString().split('T')[0];

      if (dailyMap[recordDate]) {
        dailyMap[recordDate].total += record.quantity;
        dailyMap[recordDate].records += 1;
      }
    });

    // Convert to array format for charts
    const summaries: ConsumptionSummary[] = Object.entries(dailyMap).map(([date, summary]) => ({
      date,
      total: summary.total,
      records: summary.records
    }));

    // Sort by date
    summaries.sort((a, b) => a.date.localeCompare(b.date));

    return { data: summaries, error: null };
  } catch (err) {
    console.error('Exception generating consumption summary:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Unknown error generating consumption summary'
    };
  }
}

/**
 * Gets consumption by department for the given date range
 * @param startDate Start date for the summary
 * @param endDate End date for the summary
 * @param locationId Optional location ID for filtering
 * @returns Consumption data grouped by department and month
 */
export async function getConsumptionByDepartment(
  startDate: Date,
  endDate: Date,
  locationId?: string
): Promise<{ data: any[]; error: string | null }> {
  try {
    // Fetch consumption records with user details
    const { data: records, error } = await getConsumptionRecords(startDate, endDate, locationId);

    if (error) {
      return { data: [], error };
    }

    // Define departments
    const departments = ['Engineering', 'Maintenance', 'Operations', 'Quality Control'];

    // Group by month and department
    const monthlyData: Record<string, Record<string, number>> = {};

    records.forEach(record => {
      if (!record.user_department) return;

      // Format month
      const recordDate = new Date(record.recorded_at);
      const month = `${recordDate.toLocaleString('default', { month: 'short' })} ${recordDate.getFullYear()}`;

      // Initialize month if not exists
      if (!monthlyData[month]) {
        monthlyData[month] = {};
        departments.forEach(dept => {
          monthlyData[month][dept] = 0;
        });
      }

      // Add consumption to department
      if (departments.includes(record.user_department)) {
        monthlyData[month][record.user_department] += record.quantity;
      }
    });

    // Convert to array format for charts
    const result = Object.entries(monthlyData).map(([month, deptData]) => ({
      month,
      ...deptData
    }));

    // Sort by month
    result.sort((a, b) => {
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');

      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });

    return { data: result, error: null };
  } catch (err) {
    console.error('Exception getting consumption by department:', err);
    return {
      data: [],
      error: err instanceof Error ? err.message : 'Unknown error getting consumption by department'
    };
  }
}
