import { BaseRepository, QueryOptions } from './base-repository';
import { connectionManager } from '../lib/supabase';
import { fetchById, fetchMany, insert, update, remove } from '../lib/db-utils';
import { Database } from '../types/supabase';

// Type aliases for better readability
type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];

/**
 * Repository for inventory items
 */
export class InventoryItemRepository implements BaseRepository<InventoryItem, InventoryItemInsert, InventoryItemUpdate> {
  private readonly tableName = 'inventory_items';

  /**
   * Find an inventory item by ID
   * @param id Inventory item ID
   * @returns Promise resolving to the inventory item or null if not found
   */
  async findById(id: string): Promise<InventoryItem | null> {
    const result = await fetchById<InventoryItem>(this.tableName, id);
    return result.data;
  }

  /**
   * Find all inventory items
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findAll(options?: QueryOptions): Promise<InventoryItem[]> {
    const result = await fetchMany<InventoryItem>(this.tableName, options);
    return result.data || [];
  }

  /**
   * Find inventory items by a filter
   * @param filter Filter criteria
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findBy(filter: Record<string, any>, options?: QueryOptions): Promise<InventoryItem[]> {
    const result = await fetchMany<InventoryItem>(this.tableName, {
      ...options,
      filters: filter,
    });
    return result.data || [];
  }

  /**
   * Create a new inventory item
   * @param data Inventory item data
   * @returns Promise resolving to the created inventory item
   */
  async create(data: InventoryItemInsert): Promise<InventoryItem> {
    const result = await insert<InventoryItem, InventoryItemInsert>(this.tableName, data);

    if (!result.data) {
      throw new Error('Failed to create inventory item');
    }

    return result.data;
  }

  /**
   * Update an existing inventory item
   * @param id Inventory item ID
   * @param data Inventory item data
   * @returns Promise resolving to the updated inventory item
   */
  async update(id: string, data: InventoryItemUpdate): Promise<InventoryItem> {
    const result = await update<InventoryItem, InventoryItemUpdate>(this.tableName, id, data);

    if (!result.data) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }

    return result.data;
  }

  /**
   * Delete an inventory item
   * @param id Inventory item ID
   * @returns Promise resolving to true if the inventory item was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await remove(this.tableName, id);
    return result.success;
  }

  /**
   * Count inventory items
   * @param filter Filter criteria
   * @returns Promise resolving to the count
   */
  async count(filter?: Record<string, any>): Promise<number> {
    try {
      const query = connectionManager.getClient().from(this.tableName).select('id', { count: 'exact' });

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error counting inventory items:', error);
      return 0;
    }
  }

  /**
   * Find inventory items by location
   * @param locationId Location ID
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findByLocation(locationId: string, options?: QueryOptions): Promise<InventoryItem[]> {
    return this.findBy({ location_id: locationId }, options);
  }

  /**
   * Find inventory items by category
   * @param category Category
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findByCategory(category: string, options?: QueryOptions): Promise<InventoryItem[]> {
    return this.findBy({ category }, options);
  }

  /**
   * Find inventory items by status
   * @param status Status
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findByStatus(status: 'normal' | 'low' | 'critical', options?: QueryOptions): Promise<InventoryItem[]> {
    return this.findBy({ status }, options);
  }

  /**
   * Find inventory items that are expiring soon
   * @param days Number of days
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findExpiringSoon(days: number, options?: QueryOptions): Promise<InventoryItem[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const query = client
          .from(this.tableName)
          .select('*')
          .not('expiry_date', 'is', null)
          .lte('expiry_date', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (options?.limit) {
          query.limit(options.limit);
        }

        if (options?.offset) {
          query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        if (options?.orderBy) {
          query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
        } else {
          query.order('expiry_date', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data as InventoryItem[];
      });

      return result;
    } catch (error) {
      console.error('Error finding expiring inventory items:', error);
      return [];
    }
  }

  /**
   * Find inventory items that need to be restocked
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async findNeedingRestock(options?: QueryOptions): Promise<InventoryItem[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const query = client
          .from(this.tableName)
          .select('*')
          .lte('current_quantity', client.raw('minimum_quantity'));

        if (options?.limit) {
          query.limit(options.limit);
        }

        if (options?.offset) {
          query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        if (options?.orderBy) {
          query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
        } else {
          query.order('current_quantity', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data as InventoryItem[];
      });

      return result;
    } catch (error) {
      console.error('Error finding inventory items needing restock:', error);
      return [];
    }
  }

  /**
   * Search inventory items by name, description, or ID
   * @param searchTerm Search term
   * @param options Query options
   * @returns Promise resolving to an array of inventory items
   */
  async search(searchTerm: string, options?: QueryOptions): Promise<InventoryItem[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const query = client
          .from(this.tableName)
          .select('*')
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);

        if (options?.limit) {
          query.limit(options.limit);
        }

        if (options?.offset) {
          query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        if (options?.orderBy) {
          query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
        } else {
          query.order('name', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        return data as InventoryItem[];
      });

      return result;
    } catch (error) {
      console.error('Error searching inventory items:', error);
      return [];
    }
  }
}
