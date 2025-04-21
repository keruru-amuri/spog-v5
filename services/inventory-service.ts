import { InventoryItem } from '@/types/inventory';
import { ApiResponse } from '@/types/api';

/**
 * Service for interacting with inventory API endpoints
 */
export class InventoryService {
  private readonly baseUrl = '/api/inventory';

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
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inventory items');
      }

      const data = await response.json();
      return {
        data: data.items,
        pagination: data.pagination,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return {
        data: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inventory item');
      }

      const data = await response.json();
      return {
        data: data.item,
        success: true,
      };
    } catch (error) {
      console.error(`Error fetching inventory item ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create inventory item');
      }

      const data = await response.json();
      return {
        data: data.item,
        success: true,
      };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update inventory item');
      }

      const data = await response.json();
      return {
        data: data.item,
        success: true,
      };
    } catch (error) {
      console.error(`Error updating inventory item ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete inventory item');
      }

      return {
        data: true,
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting inventory item ${id}:`, error);
      return {
        data: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
