import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET as GET_INVENTORY_STATUS } from '../../app/api/reports/inventory-status/route';
import { GET as GET_CONSUMPTION_TRENDS } from '../../app/api/reports/consumption-trends/route';
import { GET as GET_EXPIRY } from '../../app/api/reports/expiry/route';
import { GET as GET_LOCATION_UTILIZATION } from '../../app/api/reports/location-utilization/route';
import { POST as POST_EXPORT } from '../../app/api/reports/export/route';
import { ReportService } from '../../services/report-service';
import { hasPermission } from '../../lib/auth';
import { createServerClient } from '../../lib/supabase-server';

// Mock the report service
jest.mock('../../services/report-service', () => {
  return {
    ReportService: jest.fn().mockImplementation(() => ({
      generateInventoryStatusReport: jest.fn(),
      generateConsumptionTrendsReport: jest.fn(),
      generateExpiryReport: jest.fn(),
      generateLocationUtilizationReport: jest.fn(),
      convertToCSV: jest.fn(),
    })),
  };
});

// Mock the auth library
jest.mock('../../lib/auth', () => {
  return {
    hasPermission: jest.fn(),
  };
});

// Mock the supabase server client
jest.mock('../../lib/supabase-server', () => {
  return {
    createServerClient: jest.fn().mockReturnValue({
      auth: {
        getUser: jest.fn(),
      },
    }),
  };
});

// Mock NextRequest
const createMockRequest = (method: string, url: string, body?: any) => {
  const request = {
    method,
    url,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
  
  // Add URL object for GET requests
  if (method === 'GET') {
    const urlObj = new URL(url);
    request.url = urlObj.toString();
  }
  
  return request;
};

describe('Reports API Endpoints', () => {
  let mockReportService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked report service instance
    mockReportService = (ReportService as jest.Mock).mock.results[0]?.value || new ReportService();
    
    // Mock the auth getUser method
    const mockSupabase = createServerClient();
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      },
      error: null,
    });
    
    // Mock hasPermission to return true by default
    (hasPermission as jest.Mock).mockResolvedValue(true);
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('GET /api/reports/inventory-status', () => {
    it('should return inventory status report in JSON format', async () => {
      // Mock report service
      const mockReportData = {
        report_type: 'inventory-status',
        generated_at: '2023-05-01T00:00:00Z',
        summary: {
          total_items: 10,
          low_stock_items: 2,
          critical_stock_items: 1,
          average_stock_level: 65,
        },
        items: [
          { id: 'item-1', name: 'Item 1', status: 'normal' },
          { id: 'item-2', name: 'Item 2', status: 'low' },
        ],
      };
      mockReportService.generateInventoryStatusReport.mockResolvedValue(mockReportData);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/reports/inventory-status');
      
      // Call the handler
      const response = await GET_INVENTORY_STATUS(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockReportData);
      expect(mockReportService.generateInventoryStatusReport).toHaveBeenCalledWith(
        expect.objectContaining({ format: 'json' })
      );
    });
    
    it('should return inventory status report in CSV format', async () => {
      // Mock report service
      const mockReportData = {
        report_type: 'inventory-status',
        items: [
          { id: 'item-1', name: 'Item 1', status: 'normal' },
          { id: 'item-2', name: 'Item 2', status: 'low' },
        ],
      };
      mockReportService.generateInventoryStatusReport.mockResolvedValue(mockReportData);
      mockReportService.convertToCSV.mockReturnValue('ID,Name,Status\nitem-1,Item 1,normal\nitem-2,Item 2,low');
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/reports/inventory-status?format=csv');
      
      // Call the handler
      const response = await GET_INVENTORY_STATUS(request);
      const text = await response.text();
      
      // Assertions
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(text).toContain('ID,Name,Status');
      expect(mockReportService.convertToCSV).toHaveBeenCalledWith(mockReportData);
    });
    
    it('should return 403 if user lacks permission', async () => {
      // Mock hasPermission to return false
      (hasPermission as jest.Mock).mockResolvedValue(false);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/reports/inventory-status');
      
      // Call the handler
      const response = await GET_INVENTORY_STATUS(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });
  
  describe('GET /api/reports/consumption-trends', () => {
    it('should return consumption trends report with grouping by day', async () => {
      // Mock report service
      const mockReportData = {
        report_type: 'consumption-trends',
        generated_at: '2023-05-01T00:00:00Z',
        summary: {
          total_consumption: 500,
          total_records: 10,
          average_per_record: 50,
        },
        trends: [
          { date: '2023-04-28', total_quantity: 150, consumption_count: 3 },
          { date: '2023-04-29', total_quantity: 200, consumption_count: 4 },
        ],
      };
      mockReportService.generateConsumptionTrendsReport.mockResolvedValue(mockReportData);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/reports/consumption-trends?group_by=day');
      
      // Call the handler
      const response = await GET_CONSUMPTION_TRENDS(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockReportData);
      expect(mockReportService.generateConsumptionTrendsReport).toHaveBeenCalledWith(
        expect.objectContaining({ group_by: 'day' })
      );
    });
  });
  
  describe('GET /api/reports/expiry', () => {
    it('should return expiry report with days until expiry parameter', async () => {
      // Mock report service
      const mockReportData = {
        report_type: 'expiry',
        generated_at: '2023-05-01T00:00:00Z',
        summary: {
          total_expiring_items: 3,
          expired_items: 1,
          critical_items: 1,
          warning_items: 1,
        },
        items: [
          { id: 'item-1', name: 'Item 1', days_remaining: -2, status: 'expired' },
          { id: 'item-2', name: 'Item 2', days_remaining: 5, status: 'critical' },
        ],
      };
      mockReportService.generateExpiryReport.mockResolvedValue(mockReportData);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/reports/expiry?days_until_expiry=15');
      
      // Call the handler
      const response = await GET_EXPIRY(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockReportData);
      expect(mockReportService.generateExpiryReport).toHaveBeenCalledWith(
        expect.objectContaining({ days_until_expiry: 15 })
      );
    });
  });
  
  describe('GET /api/reports/location-utilization', () => {
    it('should return location utilization report for a specific location', async () => {
      // Mock report service
      const mockReportData = {
        report_type: 'location-utilization',
        generated_at: '2023-05-01T00:00:00Z',
        summary: {
          total_locations: 1,
          total_items: 5,
          average_items_per_location: 5,
        },
        locations: [
          {
            location_id: 'location-1',
            location_name: 'Storage A',
            total_items: 5,
            total_quantity: 500,
          },
        ],
      };
      mockReportService.generateLocationUtilizationReport.mockResolvedValue(mockReportData);
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/reports/location-utilization?location_id=location-1');
      
      // Call the handler
      const response = await GET_LOCATION_UTILIZATION(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual(mockReportData);
      expect(mockReportService.generateLocationUtilizationReport).toHaveBeenCalledWith(
        expect.objectContaining({ location_id: 'location-1' })
      );
    });
  });
  
  describe('POST /api/reports/export', () => {
    it('should export a report in CSV format', async () => {
      // Mock report service
      const mockReportData = {
        report_type: 'inventory-status',
        items: [
          { id: 'item-1', name: 'Item 1', status: 'normal' },
          { id: 'item-2', name: 'Item 2', status: 'low' },
        ],
      };
      mockReportService.generateInventoryStatusReport.mockResolvedValue(mockReportData);
      mockReportService.convertToCSV.mockReturnValue('ID,Name,Status\nitem-1,Item 1,normal\nitem-2,Item 2,low');
      
      // Create mock request
      const requestBody = {
        report_type: 'inventory-status',
        parameters: {
          category: 'Sealant',
        },
        format: 'csv',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/reports/export', requestBody);
      
      // Call the handler
      const response = await POST_EXPORT(request);
      const text = await response.text();
      
      // Assertions
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      expect(text).toContain('ID,Name,Status');
      expect(mockReportService.generateInventoryStatusReport).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'Sealant',
          format: 'csv',
        })
      );
    });
    
    it('should return 403 if user lacks export permission', async () => {
      // Mock hasPermission to return false
      (hasPermission as jest.Mock).mockResolvedValue(false);
      
      // Create mock request
      const requestBody = {
        report_type: 'inventory-status',
        format: 'csv',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/reports/export', requestBody);
      
      // Call the handler
      const response = await POST_EXPORT(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });
});
