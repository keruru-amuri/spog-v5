import { supabase } from '@/lib/supabase';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_balance: number;
  original_amount: number;
  unit: string;
  status: 'normal' | 'low' | 'critical';
  location_id?: string;
  location_name?: string;
  created_at?: string;
  updated_at?: string;
  consumption_rate?: number;
  reorder_point?: number;
}

/**
 * Fetches inventory items with optional filtering
 * @param category Optional category filter
 * @param locationId Optional location filter
 * @returns Array of inventory items
 */
export async function getInventoryItems(
  category?: string,
  locationId?: string
): Promise<{ data: InventoryItem[]; error: string | null }> {
  try {
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        locations (
          id,
          name
        )
      `);
    
    // Apply filters if provided
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (locationId && locationId !== 'all') {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching inventory items:', error);
      return { data: [], error: error.message };
    }
    
    // Transform data to match expected format
    const inventoryItems: InventoryItem[] = data.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      current_balance: item.current_balance,
      original_amount: item.original_amount,
      unit: item.unit,
      status: item.status || 'normal',
      location_id: item.location_id,
      location_name: item.locations?.name,
      created_at: item.created_at,
      updated_at: item.updated_at,
      // We'll calculate these later
      consumption_rate: undefined,
      reorder_point: item.reorder_point || item.original_amount * 0.3 // Default to 30% of original amount
    }));
    
    return { data: inventoryItems, error: null };
  } catch (err) {
    console.error('Exception fetching inventory items:', err);
    return { 
      data: [], 
      error: err instanceof Error ? err.message : 'Unknown error fetching inventory items' 
    };
  }
}

/**
 * Calculates consumption rates for inventory items based on consumption records
 * @param items Inventory items to calculate rates for
 * @param days Number of days to consider for rate calculation
 * @returns Items with consumption rates added
 */
export async function calculateConsumptionRates(
  items: InventoryItem[],
  days: number = 30
): Promise<{ data: InventoryItem[]; error: string | null }> {
  try {
    // Get all item IDs
    const itemIds = items.map(item => item.id);
    
    // Calculate the date range for consumption records
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch consumption records for these items within the date range
    const { data: records, error } = await supabase
      .from('consumption_records')
      .select('inventory_item_id, quantity')
      .in('inventory_item_id', itemIds)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString());
    
    if (error) {
      console.error('Error fetching consumption records:', error);
      return { data: items, error: error.message };
    }
    
    // Calculate consumption rate for each item
    const itemsWithRates = items.map(item => {
      // Find all consumption records for this item
      const itemRecords = records.filter(record => record.inventory_item_id === item.id);
      
      // Calculate total consumption
      const totalConsumption = itemRecords.reduce((sum, record) => sum + record.quantity, 0);
      
      // Calculate daily consumption rate
      const consumptionRate = totalConsumption / days;
      
      // Calculate reorder point if not already set
      const reorderPoint = item.reorder_point || item.original_amount * 0.3;
      
      return {
        ...item,
        consumption_rate: consumptionRate,
        reorder_point: reorderPoint
      };
    });
    
    return { data: itemsWithRates, error: null };
  } catch (err) {
    console.error('Exception calculating consumption rates:', err);
    return { 
      data: items, 
      error: err instanceof Error ? err.message : 'Unknown error calculating consumption rates' 
    };
  }
}
