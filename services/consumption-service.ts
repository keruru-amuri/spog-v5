import { ApiResponse } from '@/types/api';

/**
 * Type for consumption record
 */
export interface ConsumptionRecord {
  id: string;
  inventory_item_id: string;
  user_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  recorded_at: string;
  // Joined fields
  item_name?: string;
  user_name?: string;
}

/**
 * Type for creating a consumption record
 */
export interface CreateConsumptionRecord {
  inventory_item_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  recorded_at?: string;
}

/**
 * Type for consumption summary by item
 */
export interface ConsumptionSummaryByItem {
  inventory_item_id: string;
  item_name: string;
  category: string;
  total_quantity: number;
  consumption_count: number;
}

/**
 * Type for consumption summary by user
 */
export interface ConsumptionSummaryByUser {
  user_id: string;
  user_name: string;
  total_quantity: number;
  consumption_count: number;
}

/**
 * Service for interacting with consumption API endpoints
 */
export class ConsumptionService {
  private readonly baseUrl = '/api/consumption';

  /**
   * Fetch consumption records with optional filtering
   * @param params Query parameters for filtering
   * @returns Promise resolving to consumption records and pagination info
   */
  async getConsumptionRecords(params?: {
    inventory_item_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<ApiResponse<ConsumptionRecord[]>> {
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
        throw new Error(errorData.error || 'Failed to fetch consumption records');
      }

      const data = await response.json();
      return {
        data: data.records,
        pagination: data.pagination,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching consumption records:', error);
      return {
        data: [],
        pagination: { total: 0, limit: 0, offset: 0, hasMore: false },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fetch a specific consumption record by ID
   * @param id Consumption record ID
   * @returns Promise resolving to the consumption record
   */
  async getConsumptionRecord(id: string): Promise<ApiResponse<ConsumptionRecord>> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch consumption record');
      }

      const data = await response.json();
      return {
        data: data.record,
        success: true,
      };
    } catch (error) {
      console.error(`Error fetching consumption record ${id}:`, error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a new consumption record
   * @param record Consumption record data
   * @returns Promise resolving to the created consumption record
   */
  async createConsumptionRecord(record: CreateConsumptionRecord): Promise<ApiResponse<ConsumptionRecord>> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(record),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create consumption record');
      }

      const data = await response.json();
      return {
        data: data.record,
        success: true,
      };
    } catch (error) {
      console.error('Error creating consumption record:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get consumption summary by item
   * @param startDate Start date
   * @param endDate End date
   * @returns Promise resolving to consumption summary by item
   */
  async getConsumptionSummaryByItem(startDate: string, endDate: string): Promise<ApiResponse<ConsumptionSummaryByItem[]>> {
    try {
      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        summary_type: 'item',
      });

      const response = await fetch(`${this.baseUrl}/summary?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch consumption summary');
      }

      const data = await response.json();
      return {
        data: data.summary,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching consumption summary by item:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get consumption summary by user
   * @param startDate Start date
   * @param endDate End date
   * @returns Promise resolving to consumption summary by user
   */
  async getConsumptionSummaryByUser(startDate: string, endDate: string): Promise<ApiResponse<ConsumptionSummaryByUser[]>> {
    try {
      const queryParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        summary_type: 'user',
      });

      const response = await fetch(`${this.baseUrl}/summary?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch consumption summary');
      }

      const data = await response.json();
      return {
        data: data.summary,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching consumption summary by user:', error);
      return {
        data: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
