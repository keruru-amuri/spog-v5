import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InventoryService } from '@/services/inventory-service';
import { InventoryItem } from '@/types/inventory';

// Mock fetch
global.fetch = jest.fn();

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventoryItems', () => {
    it('should fetch inventory items successfully', async () => {
      // Mock response data
      const mockItems: InventoryItem[] = [
        {
          id: '123',
          name: 'Test Item',
          category: 'Sealant',
          current_balance: 100,
          original_amount: 200,
          unit: 'g',
          status: 'normal',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        items: mockItems,
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
      const result = await service.getInventoryItems();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/inventory', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItems);
      expect(result.pagination).toEqual(mockResponse.pagination);
    });

    it('should handle API errors', async () => {
      // Mock error response
      const errorMessage = 'Failed to fetch inventory items';
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      });

      // Call the service
      const result = await service.getInventoryItems();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/inventory', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      // Call the service
      const result = await service.getInventoryItems();

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/inventory', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('Network error');
    });

    it('should apply query parameters correctly', async () => {
      // Mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [], pagination: { total: 0, limit: 10, offset: 0, hasMore: false } }),
      });

      // Query parameters
      const params = {
        category: 'Sealant',
        location_id: '123',
        status: 'low' as const,
        search: 'test',
        limit: 10,
        offset: 20,
        sort_by: 'name',
        sort_order: 'asc' as const,
      };

      // Call the service
      await service.getInventoryItems(params);

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/inventory?category=Sealant&location_id=123&status=low&search=test&limit=10&offset=20&sort_by=name&sort_order=asc',
        expect.any(Object)
      );
    });
  });

  describe('getInventoryItem', () => {
    it('should fetch a single inventory item successfully', async () => {
      // Mock item
      const mockItem: InventoryItem = {
        id: '123',
        name: 'Test Item',
        category: 'Sealant',
        current_balance: 100,
        original_amount: 200,
        unit: 'g',
        status: 'normal',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      // Mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item: mockItem }),
      });

      // Call the service
      const result = await service.getInventoryItem('123');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/inventory/123', expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockItem);
    });

    it('should handle item not found', async () => {
      // Mock error response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Inventory item not found' }),
      });

      // Call the service
      const result = await service.getInventoryItem('999');

      // Assertions
      expect(global.fetch).toHaveBeenCalledWith('/api/inventory/999', expect.any(Object));
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Inventory item not found');
    });
  });
});
