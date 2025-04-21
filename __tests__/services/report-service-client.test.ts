import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ReportServiceClient } from '@/services/report-service-client';

// Mock fetch
global.fetch = jest.fn();

describe('ReportServiceClient', () => {
  let service: ReportServiceClient;

  beforeEach(() => {
    service = new ReportServiceClient();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventoryStatusReport', () => {
    it('should fetch inventory status report successfully', async () => {
      // Mock response data
      const mockReport = {
        report_type: 'inventory-status',
        generated_at: '2023-01-01T00:00:00Z',
        parameters: {},
        summary: {
          total_items: 100,
          low_stock_items: 10,
          critical_stock_items: 5,
          average_stock_level: 75,
        },
        items: [
          {
            id: '123',
            name: 'Test Item',
            category: 'Test Category',
            location_id: '456',
            current_quantity: 100,
            original_amount: 200,
            minimum_quantity: 50,
            unit: 'g',
            stock_percentage: 50,
            status: 'normal',
            last_updated: '2023-01-01T00:00:00Z',
          },
        ],
      };

      // Mock fetch implementation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      // Call the service
      const result = await service.getInventoryStatusReport();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/inventory-status?', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReport);
    });

    it('should handle API errors', async () => {
      // Mock error response
      const errorMessage = 'Failed to fetch inventory status report';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      // Call the service
      const result = await service.getInventoryStatusReport();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/inventory-status?', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe(errorMessage);
    });

    it('should apply query parameters correctly', async () => {
      // Mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // Query parameters
      const params = {
        start_date: '2023-01-01T00:00:00Z',
        end_date: '2023-01-31T23:59:59Z',
        category: 'Test Category',
        location_id: '123',
        status: 'low',
      };

      // Call the service
      await service.getInventoryStatusReport(params);

      // Assertions
      expect(global.fetch).toHaveBeenCalled();
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/api/reports/inventory-status?');
      expect(url).toContain('start_date=');
      expect(url).toContain('end_date=');
      expect(url).toContain('category=');
      expect(url).toContain('location_id=123');
      expect(url).toContain('status=low');
    });
  });

  describe('getConsumptionTrendsReport', () => {
    it('should fetch consumption trends report successfully', async () => {
      // Mock response data
      const mockReport = {
        report_type: 'consumption-trends',
        generated_at: '2023-01-01T00:00:00Z',
        parameters: {},
        period: {
          start_date: '2023-01-01T00:00:00Z',
          end_date: '2023-01-31T23:59:59Z',
        },
        summary: {
          total_consumption: 1000,
          total_records: 50,
          average_per_record: 20,
        },
        trends: [
          {
            month: '2023-01',
            total_quantity: 500,
            consumption_count: 25,
          },
        ],
      };

      // Mock fetch implementation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReport,
      });

      // Call the service
      const result = await service.getConsumptionTrendsReport();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/reports/consumption-trends?', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockReport);
    });
  });

  describe('downloadReport', () => {
    it('should create a download link with the correct URL', async () => {
      // Mock document.createElement and other DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };

      document.createElement = jest.fn().mockReturnValue(mockLink);
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      // Call the service
      const params = {
        report_type: 'inventory-status',
        parameters: {
          start_date: '2023-01-01T00:00:00Z',
          end_date: '2023-01-31T23:59:59Z',
        },
      };

      await service.downloadReport(params, 'inventory-report.csv');

      // Assertions
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toContain('/api/reports/inventory-status?format=csv&start_date=2023-01-01T00%3A00%3A00Z&end_date=2023-01-31T23%3A59%3A59Z');
      expect(mockLink.download).toBe('inventory-report.csv');
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });
});
