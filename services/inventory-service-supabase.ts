import { InventoryItem } from '@/types/inventory';
import { ApiResponse } from '@/types/api';
import { supabase, connectionManager } from '@/lib/supabase';

/**
 * Service for interacting with inventory data in Supabase
 */
export class InventoryServiceSupabase {
  /**
   * Fetch inventory items with optional filtering
   * @param params Query parameters for filtering
   * @returns Promise resolving to inventory items and pagination info
   */
  async getInventoryItems(params?: {
    category?: string;
    location_id?: string;
    status?: 'normal' | 'low' | 'critical';
    search?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<ApiResponse<InventoryItem[]>> {
    try {
      // Start building the query
      let query = supabase
        .from('inventory_items')
        .select(`
          *,
          locations(name)
        `);

      // Apply filters
      if (params?.category) {
        query = query.eq('category', params.category);
      }

      if (params?.location_id) {
        query = query.eq('location_id', params.location_id);
      }

      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      // Build a separate query for counting
      let countQuery = supabase
        .from('inventory_items')
        .select('*', { count: 'exact' });

      // Apply the same filters to the count query
      if (params?.category) {
        countQuery = countQuery.eq('category', params.category);
      }

      if (params?.location_id) {
        countQuery = countQuery.eq('location_id', params.location_id);
      }

      if (params?.status) {
        countQuery = countQuery.eq('status', params.status);
      }

      if (params?.search) {
        countQuery = countQuery.ilike('name', `%${params.search}%`);
      }

      // Execute the count query
      const { count, error: countError } = await countQuery;

      if (countError) {
        throw new Error(countError.message);
      }

      // Apply sorting
      if (params?.sort_by) {
        const order = params.sort_order === 'desc' ? true : false;
        query = query.order(params.sort_by, { ascending: !order });
      } else {
        // Default sorting by name ascending
        query = query.order('name', { ascending: true });
      }

      // Apply pagination
      const limit = params?.limit || 50;
      const offset = params?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Execute the query
      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Transform the data to match the InventoryItem interface
      const items: InventoryItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || undefined,
        category: item.category,
        location_id: item.location_id || undefined,
        location_name: item.locations?.name,
        current_balance: item.current_balance,
        original_amount: item.original_amount,
        unit: item.unit,
        consumption_unit: item.consumption_unit,
        status: item.status,
        last_refilled: item.last_refilled || undefined,
        image_url: item.image_url || undefined,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      return {
        data: items,
        pagination: {
          total: count,
          limit,
          offset,
          hasMore: (offset + limit) < count
        },
        success: true
      };
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return {
        data: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch a specific inventory item by ID
   * @param id Inventory item ID
   * @returns Promise resolving to the inventory item
   */
  async getInventoryItem(id: string): Promise<ApiResponse<InventoryItem>> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          locations(name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Inventory item not found');
      }

      const item: InventoryItem = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        location_id: data.location_id || undefined,
        location_name: data.locations?.name,
        current_balance: data.current_balance,
        original_amount: data.original_amount,
        unit: data.unit,
        consumption_unit: data.consumption_unit,
        status: data.status,
        last_refilled: data.last_refilled || undefined,
        image_url: data.image_url || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return {
        data: item,
        success: true
      };
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new inventory item
   * @param item Inventory item data
   * @returns Promise resolving to the created inventory item
   */
  async createInventoryItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<InventoryItem>> {
    try {
      const now = new Date().toISOString();

      // Prepare the data for insertion
      const insertData = {
        name: item.name,
        category: item.category,
        location_id: item.location_id,
        current_balance: item.current_balance,
        original_amount: item.original_amount,
        unit: item.unit,
        consumption_unit: item.consumption_unit || item.unit,
        status: item.status,
        description: item.description,
        image_url: item.image_url,
        last_refilled: item.last_refilled,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insertData)
        .select(`
          *,
          locations(name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create inventory item');
      }

      const newItem: InventoryItem = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        location_id: data.location_id || undefined,
        location_name: data.locations?.name,
        current_balance: data.current_balance,
        original_amount: data.original_amount,
        unit: data.unit,
        consumption_unit: data.consumption_unit,
        status: data.status,
        last_refilled: data.last_refilled || undefined,
        image_url: data.image_url || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return {
        data: newItem,
        success: true
      };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update an existing inventory item
   * @param id Inventory item ID
   * @param item Updated inventory item data
   * @returns Promise resolving to the updated inventory item
   */
  async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    try {
      // Prepare the data for update
      const updateData = {
        ...item,
        updated_at: new Date().toISOString()
      };

      // Remove properties that shouldn't be sent to the database
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.location_name;

      const { data, error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          locations(name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Inventory item not found');
      }

      const updatedItem: InventoryItem = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        category: data.category,
        location_id: data.location_id || undefined,
        location_name: data.locations?.name,
        current_balance: data.current_balance,
        original_amount: data.original_amount,
        unit: data.unit,
        consumption_unit: data.consumption_unit,
        status: data.status,
        last_refilled: data.last_refilled || undefined,
        image_url: data.image_url || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return {
        data: updatedItem,
        success: true
      };
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete an inventory item
   * @param id Inventory item ID
   * @returns Promise resolving to success status
   */
  async deleteInventoryItem(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: true,
        success: true
      };
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
