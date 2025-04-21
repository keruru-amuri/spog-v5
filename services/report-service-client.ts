import { ApiResponse } from '@/types/api';

/**
 * Base report parameters
 */
export interface BaseReportParams {
  start_date?: string;
  end_date?: string;
  format?: 'json' | 'csv';
}

/**
 * Inventory status report parameters
 */
export interface InventoryStatusReportParams extends BaseReportParams {
  category?: string;
  location_id?: string;
  status?: 'all' | 'normal' | 'low' | 'critical';
}

/**
 * Consumption trends report parameters
 */
export interface ConsumptionTrendsReportParams extends BaseReportParams {
  group_by?: 'day' | 'week' | 'month' | 'category' | 'user';
  category?: string;
  user_id?: string;
}

/**
 * Expiry report parameters
 */
export interface ExpiryReportParams extends BaseReportParams {
  days_until_expiry?: number;
  category?: string;
}

/**
 * Location utilization report parameters
 */
export interface LocationUtilizationReportParams extends BaseReportParams {
  location_id?: string;
  include_empty?: boolean;
}

/**
 * Report export parameters
 */
export interface ReportExportParams {
  report_type: 'inventory-status' | 'consumption-trends' | 'expiry' | 'location-utilization';
  parameters?: Record<string, string>;
  format?: 'json' | 'csv';
}

/**
 * Inventory status report data
 */
export interface InventoryStatusReport {
  report_type: 'inventory-status';
  generated_at: string;
  parameters: InventoryStatusReportParams;
  summary: {
    total_items: number;
    low_stock_items: number;
    critical_stock_items: number;
    average_stock_level: number;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    location_id: string;
    current_quantity: number;
    original_amount: number;
    minimum_quantity: number;
    unit: string;
    stock_percentage: number;
    status: 'normal' | 'low' | 'critical';
    last_updated: string;
  }>;
}

/**
 * Consumption trends report data
 */
export interface ConsumptionTrendsReport {
  report_type: 'consumption-trends';
  generated_at: string;
  parameters: ConsumptionTrendsReportParams;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_consumption: number;
    total_records: number;
    average_per_record: number;
  };
  trends: Array<{
    // For day grouping
    date?: string;
    // For week grouping
    week_start?: string;
    // For month grouping
    month?: string;
    // For category grouping
    category?: string;
    // For user grouping
    user_id?: string;
    user_name?: string;
    // Common fields
    total_quantity: number;
    consumption_count: number;
  }>;
}

/**
 * Expiry report data
 */
export interface ExpiryReport {
  report_type: 'expiry';
  generated_at: string;
  parameters: ExpiryReportParams;
  summary: {
    total_expiring_items: number;
    expired_items: number;
    critical_items: number;
    warning_items: number;
  };
  items: Array<{
    id: string;
    name: string;
    category: string;
    location_id: string;
    current_quantity: number;
    unit: string;
    expiry_date: string;
    days_remaining: number;
    status: 'expired' | 'critical' | 'warning';
  }>;
}

/**
 * Location utilization report data
 */
export interface LocationUtilizationReport {
  report_type: 'location-utilization';
  generated_at: string;
  parameters: LocationUtilizationReportParams;
  summary: {
    total_locations: number;
    total_items: number;
    average_items_per_location: number;
  };
  locations: Array<{
    location_id: string;
    location_name: string;
    location_type: string;
    total_items: number;
    total_quantity: number;
    categories: Array<{
      category: string;
      item_count: number;
      total_quantity: number;
    }>;
  }>;
}

/**
 * Service for interacting with report API endpoints
 */
export class ReportServiceClient {
  /**
   * Get inventory status report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async getInventoryStatusReport(params: InventoryStatusReportParams = {}): Promise<ApiResponse<InventoryStatusReport>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/reports/inventory-status?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch inventory status report');
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching inventory status report:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get consumption trends report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async getConsumptionTrendsReport(params: ConsumptionTrendsReportParams = {}): Promise<ApiResponse<ConsumptionTrendsReport>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/reports/consumption-trends?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch consumption trends report');
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching consumption trends report:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get expiry report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async getExpiryReport(params: ExpiryReportParams = {}): Promise<ApiResponse<ExpiryReport>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/reports/expiry?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch expiry report');
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching expiry report:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get location utilization report
   * @param params Report parameters
   * @returns Promise resolving to the report data
   */
  async getLocationUtilizationReport(params: LocationUtilizationReportParams = {}): Promise<ApiResponse<LocationUtilizationReport>> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/reports/location-utilization?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch location utilization report');
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error fetching location utilization report:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export report as CSV
   * @param params Export parameters
   * @returns Promise resolving to the CSV data
   */
  async exportReport(params: ReportExportParams): Promise<ApiResponse<string>> {
    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          format: 'csv',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export report');
      }

      const data = await response.text();
      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('Error exporting report:', error);
      return {
        data: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download report as CSV
   * @param params Export parameters
   * @param filename Filename for the downloaded file
   */
  async downloadReport(params: ReportExportParams, filename: string): Promise<void> {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      queryParams.append('format', 'csv');
      
      if (params.parameters) {
        Object.entries(params.parameters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      // Create a URL for the report
      const url = `/api/reports/${params.report_type}?${queryParams.toString()}`;
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${params.report_type}-report.csv`;
      
      // Append to the document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }
}
