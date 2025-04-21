import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ConsumptionService, ConsumptionRecord } from '@/services/consumption-service';

// Mock fetch
global.fetch = jest.fn();

describe('ConsumptionService', () => {
  let service: ConsumptionService;
  
  beforeEach(() => {
    service = new ConsumptionService();
    jest.resetAllMocks();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getConsumptionRecords', () => {
    it('should fetch consumption records successfully', async () => {
      // Mock response data
      const mockRecords: ConsumptionRecord[] = [
        {
          id: '123',
          inventory_item_id: '456',
          user_id: '789',
          quantity: 100,
          unit: 'g',
          recorded_at: '2023-01-01T00:00:00Z',
          item_name: 'Test Item',
          user_name: 'Test User',
        },
      ];
      
      const mockResponse = {
        records: mockRecords,
        pagination: {
          total: 1,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };
      
      // Mock fetch implementation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Call the service
      const result = await service.getConsumptionRecords();
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/consumption', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRecords);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });
    
    it('should handle API errors', async () => {
      // Mock error response
      const errorMessage = 'Failed to fetch consumption records';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });
      
      // Call the service
      const result = await service.getConsumptionRecords();
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/consumption', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe(errorMessage);
    });
    
    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Call the service
      const result = await service.getConsumptionRecords();
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/consumption', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Network error');
    });
    
    it('should apply query parameters correctly', async () => {
      // Mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: [], pagination: { total: 0, limit: 10, offset: 0, hasMore: false } }),
      });
      
      // Query parameters
      const params = {
        inventory_item_id: '123',
        user_id: '456',
        start_date: '2023-01-01T00:00:00Z',
        end_date: '2023-01-31T23:59:59Z',
        limit: 10,
        offset: 20,
        sort_by: 'recorded_at',
        sort_order: 'desc' as const,
      };
      
      // Call the service
      await service.getConsumptionRecords(params);
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/consumption?inventory_item_id=123&user_id=456&start_date=2023-01-01T00%3A00%3A00Z&end_date=2023-01-31T23%3A59%3A59Z&limit=10&offset=20&sort_by=recorded_at&sort_order=desc',
        expect.any(Object)
      );
    });
  });
  
  describe('createConsumptionRecord', () => {
    it('should create a consumption record successfully', async () => {
      // Mock record data
      const recordData = {
        inventory_item_id: '123',
        quantity: 100,
        unit: 'g',
        notes: 'Test notes',
        recorded_at: '2023-01-01T00:00:00Z',
      };
      
      const mockResponse = {
        record: {
          id: '456',
          ...recordData,
          user_id: '789',
        },
      };
      
      // Mock fetch implementation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Call the service
      const result = await service.createConsumptionRecord(recordData);
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/consumption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recordData),
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.record);
    });
    
    it('should handle API errors when creating a record', async () => {
      // Mock record data
      const recordData = {
        inventory_item_id: '123',
        quantity: 100,
        unit: 'g',
      };
      
      // Mock error response
      const errorMessage = 'Failed to create consumption record';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });
      
      // Call the service
      const result = await service.createConsumptionRecord(recordData);
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/consumption', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe(errorMessage);
    });
  });
  
  describe('getConsumptionSummaryByItem', () => {
    it('should fetch consumption summary by item successfully', async () => {
      // Mock dates
      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-01-31T23:59:59Z';
      
      // Mock response data
      const mockSummary = [
        {
          inventory_item_id: '123',
          item_name: 'Test Item',
          category: 'Test Category',
          total_quantity: 100,
          consumption_count: 5,
        },
      ];
      
      const mockResponse = {
        summary: mockSummary,
      };
      
      // Mock fetch implementation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Call the service
      const result = await service.getConsumptionSummaryByItem(startDate, endDate);
      
      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/consumption/summary?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&summary_type=item`,
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummary);
    });
  });
});
