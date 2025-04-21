import { Location } from '@/types/location';
import { ApiResponse } from '@/types/api';

/**
 * Service for interacting with location API endpoints
 */
export class LocationService {
  private readonly baseUrl = '/api/locations';

  /**
   * Fetch all locations
   * @returns Promise resolving to locations
   */
  async getLocations(): Promise<ApiResponse<Location[]>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch locations');
      }

      const data = await response.json();
      return {
        data: data.locations,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching locations:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch location');
      }

      const data = await response.json();
      return {
        data: data.location,
        success: true,
      };
    } catch (error) {
      console.error(`Error fetching location ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
