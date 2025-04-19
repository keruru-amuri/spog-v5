import { BaseRepository, QueryOptions } from './base-repository';
import { connectionManager } from '../lib/supabase';
import { fetchById, fetchMany, insert, update, remove } from '../lib/db-utils';
import { Database } from '../types/supabase';

// Type aliases for better readability
type Location = Database['public']['Tables']['locations']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];
type LocationUpdate = Database['public']['Tables']['locations']['Update'];

/**
 * Repository for locations
 */
export class LocationRepository implements BaseRepository<Location, LocationInsert, LocationUpdate> {
  private readonly tableName = 'locations';
  
  /**
   * Find a location by ID
   * @param id Location ID
   * @returns Promise resolving to the location or null if not found
   */
  async findById(id: string): Promise<Location | null> {
    const result = await fetchById<Location>(this.tableName, id);
    return result.data;
  }
  
  /**
   * Find all locations
   * @param options Query options
   * @returns Promise resolving to an array of locations
   */
  async findAll(options?: QueryOptions): Promise<Location[]> {
    const result = await fetchMany<Location>(this.tableName, options);
    return result.data || [];
  }
  
  /**
   * Find locations by a filter
   * @param filter Filter criteria
   * @param options Query options
   * @returns Promise resolving to an array of locations
   */
  async findBy(filter: Record<string, any>, options?: QueryOptions): Promise<Location[]> {
    const result = await fetchMany<Location>(this.tableName, {
      ...options,
      filters: filter,
    });
    return result.data || [];
  }
  
  /**
   * Create a new location
   * @param data Location data
   * @returns Promise resolving to the created location
   */
  async create(data: LocationInsert): Promise<Location> {
    const result = await insert<Location, LocationInsert>(this.tableName, data);
    
    if (!result.data) {
      throw new Error('Failed to create location');
    }
    
    return result.data;
  }
  
  /**
   * Update an existing location
   * @param id Location ID
   * @param data Location data
   * @returns Promise resolving to the updated location
   */
  async update(id: string, data: LocationUpdate): Promise<Location> {
    const result = await update<Location, LocationUpdate>(this.tableName, id, data);
    
    if (!result.data) {
      throw new Error(`Location with ID ${id} not found`);
    }
    
    return result.data;
  }
  
  /**
   * Delete a location
   * @param id Location ID
   * @returns Promise resolving to true if the location was deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await remove(this.tableName, id);
    return result.success;
  }
  
  /**
   * Count locations
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
      console.error('Error counting locations:', error);
      return 0;
    }
  }
  
  /**
   * Find active locations
   * @param options Query options
   * @returns Promise resolving to an array of locations
   */
  async findActive(options?: QueryOptions): Promise<Location[]> {
    return this.findBy({ is_active: true }, options);
  }
  
  /**
   * Find locations by parent ID
   * @param parentId Parent ID
   * @param options Query options
   * @returns Promise resolving to an array of locations
   */
  async findByParent(parentId: string, options?: QueryOptions): Promise<Location[]> {
    return this.findBy({ parent_id: parentId }, options);
  }
  
  /**
   * Find root locations (locations without a parent)
   * @param options Query options
   * @returns Promise resolving to an array of locations
   */
  async findRoots(options?: QueryOptions): Promise<Location[]> {
    try {
      const result = await connectionManager.executeWithRetry(async (client) => {
        const query = client
          .from(this.tableName)
          .select('*')
          .is('parent_id', null);
        
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
        
        return data as Location[];
      });
      
      return result;
    } catch (error) {
      console.error('Error finding root locations:', error);
      return [];
    }
  }
  
  /**
   * Get the full location hierarchy
   * @returns Promise resolving to a nested location hierarchy
   */
  async getHierarchy(): Promise<LocationHierarchy[]> {
    try {
      // Get all locations
      const locations = await this.findAll({
        orderBy: { column: 'name', ascending: true },
      });
      
      // Build the hierarchy
      const hierarchy: LocationHierarchy[] = [];
      const locationMap = new Map<string, LocationHierarchy>();
      
      // First pass: create all location objects
      for (const location of locations) {
        const hierarchyItem: LocationHierarchy = {
          id: location.id,
          name: location.name,
          description: location.description,
          is_active: location.is_active,
          children: [],
        };
        
        locationMap.set(location.id, hierarchyItem);
      }
      
      // Second pass: build the hierarchy
      for (const location of locations) {
        const hierarchyItem = locationMap.get(location.id);
        
        if (!hierarchyItem) {
          continue;
        }
        
        if (location.parent_id) {
          // This is a child location
          const parent = locationMap.get(location.parent_id);
          
          if (parent) {
            parent.children.push(hierarchyItem);
          } else {
            // Parent not found, add to root
            hierarchy.push(hierarchyItem);
          }
        } else {
          // This is a root location
          hierarchy.push(hierarchyItem);
        }
      }
      
      return hierarchy;
    } catch (error) {
      console.error('Error getting location hierarchy:', error);
      return [];
    }
  }
}

/**
 * Location hierarchy interface
 */
export interface LocationHierarchy {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  children: LocationHierarchy[];
}
