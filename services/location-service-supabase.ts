import { Location } from '@/types/location';
import { ApiResponse } from '@/types/api';
import { supabase } from '@/lib/supabase';

/**
 * Service for interacting with location data in Supabase
 */
export class LocationServiceSupabase {
  /**
   * Fetch all locations
   * @returns Promise resolving to locations
   */
  async getLocations(): Promise<ApiResponse<Location[]>> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      const locations: Location[] = data.map(location => ({
        id: location.id,
        name: location.name,
        description: location.description || undefined,
        created_at: location.created_at,
        updated_at: location.updated_at
      }));

      return {
        data: locations,
        success: true
      };
    } catch (error) {
      console.error('Error fetching locations:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch a specific location by ID
   * @param id Location ID
   * @returns Promise resolving to the location
   */
  async getLocation(id: string): Promise<ApiResponse<Location>> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Location not found');
      }

      const location: Location = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return {
        data: location,
        success: true
      };
    } catch (error) {
      console.error(`Error fetching location ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new location
   * @param location Location data
   * @returns Promise resolving to the created location
   */
  async createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Location>> {
    try {
      const now = new Date().toISOString();
      
      const insertData = {
        name: location.name,
        description: location.description,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from('locations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Failed to create location');
      }

      const newLocation: Location = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return {
        data: newLocation,
        success: true
      };
    } catch (error) {
      console.error('Error creating location:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update an existing location
   * @param id Location ID
   * @param location Updated location data
   * @returns Promise resolving to the updated location
   */
  async updateLocation(id: string, location: Partial<Location>): Promise<ApiResponse<Location>> {
    try {
      const updateData = {
        ...location,
        updated_at: new Date().toISOString()
      };

      // Remove properties that shouldn't be sent to the database
      delete updateData.id;
      delete updateData.created_at;

      const { data, error } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error('Location not found');
      }

      const updatedLocation: Location = {
        id: data.id,
        name: data.name,
        description: data.description || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      return {
        data: updatedLocation,
        success: true
      };
    } catch (error) {
      console.error(`Error updating location ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a location
   * @param id Location ID
   * @returns Promise resolving to success status
   */
  async deleteLocation(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('locations')
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
      console.error(`Error deleting location ${id}:`, error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
