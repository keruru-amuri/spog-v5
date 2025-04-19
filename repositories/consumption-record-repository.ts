import { BaseRepository, QueryOptions } from './base-repository';
import { connectionManager } from '../lib/supabase';
import { fetchById, fetchMany, insert, update, remove } from '../lib/db-utils';
import { Database } from '../types/supabase';

// Type aliases for better readability
type ConsumptionRecord = Database['public']['Tables']['consumption_records']['Row'];
type ConsumptionRecordInsert = Database['public']['Tables']['consumption_records']['Insert'];
type ConsumptionRecordUpdate = Database['public']['Tables']['consumption_records']['Update'];

/**
 * Repository for consumption records
 */
export class ConsumptionRecordRepository implements BaseRepository<ConsumptionRecord, ConsumptionRecordInsert, ConsumptionRecordUpdate> {
  private readonly tableName = 'consumption_records';
  
  /**
   * Find a consumption record by ID
   * @param id Consumption record ID
   * @returns Promise resolving to the consumption record or null if not found
   */
  async findById(id: string): Promise<ConsumptionRecord | null> {
    const result = await fetchById<ConsumptionRecord>(this.tableName, id);
    return result.data;
  }
  
  /**
   * Find all consumption records
   * @param options Query options
   * @returns Promise resolving to an array of consumption records
   */
  async findAll(options?: QueryOptions): Promise<ConsumptionRecord[]> {
    const result = await fetchMany<ConsumptionRecord>(this.tableName, options);
    return result.data || [];
  }
  
  /**
   * Find consumption records by a filter
   * @param filter Filter criteria
   * @param options Query options
   * @returns Promise resolving to an array of consumption records
   */
  async findBy(filter: Record<string, any>, options?: QueryOptions): Promise<ConsumptionRecord[]> {
    const result = await fetchMany<ConsumptionRecord>(this.tableName, {
      ...options,
      filters: filter,
    });
    return result.data || [];
  }
  
  /**
   * Create a new consumption record
   * @param data Consumption record data
   * @returns Promise resolving to the created consumption record
   */
  async create(data: ConsumptionRecordInsert): Promise<ConsumptionRecord> {
    const result = await insert<ConsumptionRecord, ConsumptionRecordInsert>(this.tableName, data);
    
    if (!result.data) {
      throw new Error('Failed to create consumption record');
    }
    
    return result.data;
  }
  
  /**
   * Update an existing consumption record
   * @param id Consumption record ID
   * @param data Consumption record data
   * @returns Promise resolving to the updated consumption record
   */
  async update(id: string, data: ConsumptionRecordUpdate): Promise<ConsumptionRecord> {
    const result = await update<ConsumptionRecord, ConsumptionRecordUpdate>(this.tableName, id, data);
    
    if (!result.data) {
      throw new Error(`Consumption record with ID ${id} not found`);
    }
    
    return result.data;
  }
  
  /**
   * Delete a consumption record
   * @param id Consumption record ID
   * @returns Promise resolving to true if the consumption record was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await remove(this.tableName, id);
    return result.success;
  }
  
  /**
   * Count consumption records
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
      console.error('Error counting consumption records:', error);
      return 0;
    }
  }
  
  /**
   * Find consumption records by inventory item ID
   * @param inventoryItemId Inventory item ID
   * @param options Query options
   * @returns Promise resolving to an array of consumption records
   */
  async findByInventoryItem(inventoryItemId: string, options?: QueryOptions): Promise<ConsumptionRecord[]> {
    return this.findBy({ inventory_item_id: inventoryItemId }, options);
  }
  
  /**
   * Find consumption records by user ID
   * @param userId User ID
   * @param options Query options
   * @returns Promise resolving to an array of consumption records
   */
  async findByUser(userId: string, options?: QueryOptions): Promise<ConsumptionRecord[]> {
    return this.findBy({ user_id: userId }, options);
  }
  
  /**
   * Find consumption records by date range
   * @param startDate Start date
   * @param endDate End date
   * @param options Query options
   * @returns Promise resolving to an array of consumption records
   */
  async findByDateRange(startDate: Date, endDate: Date, options?: QueryOptions): Promise<ConsumptionRecord[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const query = client
          .from(this.tableName)
          .select('*')
          .gte('recorded_at', startDate.toISOString())
          .lte('recorded_at', endDate.toISOString());
        
        if (options?.limit) {
          query.limit(options.limit);
        }
        
        if (options?.offset) {
          query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }
        
        if (options?.orderBy) {
          query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
        } else {
          query.order('recorded_at', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        return data as ConsumptionRecord[];
      });
      
      return result;
    } catch (error) {
      console.error('Error finding consumption records by date range:', error);
      return [];
    }
  }
  
  /**
   * Get consumption summary by inventory item
   * @param startDate Start date
   * @param endDate End date
   * @returns Promise resolving to a consumption summary
   */
  async getConsumptionSummaryByItem(startDate: Date, endDate: Date): Promise<ConsumptionSummaryByItem[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client.rpc('get_consumption_summary_by_item', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });
        
        if (error) {
          throw error;
        }
        
        return data as ConsumptionSummaryByItem[];
      });
      
      return result;
    } catch (error) {
      console.error('Error getting consumption summary by item:', error);
      return [];
    }
  }
  
  /**
   * Get consumption summary by user
   * @param startDate Start date
   * @param endDate End date
   * @returns Promise resolving to a consumption summary
   */
  async getConsumptionSummaryByUser(startDate: Date, endDate: Date): Promise<ConsumptionSummaryByUser[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const { data, error } = await client.rpc('get_consumption_summary_by_user', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        });
        
        if (error) {
          throw error;
        }
        
        return data as ConsumptionSummaryByUser[];
      });
      
      return result;
    } catch (error) {
      console.error('Error getting consumption summary by user:', error);
      return [];
    }
  }
}

/**
 * Consumption summary by item interface
 */
export interface ConsumptionSummaryByItem {
  inventory_item_id: string;
  inventory_item_name: string;
  total_quantity: number;
  unit: string;
  consumption_count: number;
}

/**
 * Consumption summary by user interface
 */
export interface ConsumptionSummaryByUser {
  user_id: string;
  user_name: string;
  total_quantity: number;
  consumption_count: number;
}
