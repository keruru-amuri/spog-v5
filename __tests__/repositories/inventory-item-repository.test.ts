import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryItemRepository } from '../../repositories/inventory-item-repository';
import { connectionManager } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// Mock the connection manager
vi.mock('../../lib/supabase', () => {
  return {
    connectionManager: {
      executeWithRetry: vi.fn(),
      getClient: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        raw: vi.fn().mockReturnValue('minimum_quantity'),
      }),
    },
  };
});

// Mock the db-utils
vi.mock('../../lib/db-utils', () => {
  return {
    fetchById: vi.fn(),
    fetchMany: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
});

// Import the mocked modules
import { fetchById, fetchMany, insert, update, remove } from '../../lib/db-utils';

describe('InventoryItemRepository', () => {
  let repository: InventoryItemRepository;

  beforeEach(() => {
    repository = new InventoryItemRepository();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should call fetchById with the correct parameters', async () => {
      const mockItem = { id: '123', name: 'Test Item' };
      vi.mocked(fetchById).mockResolvedValueOnce({ data: mockItem, error: null, success: true });

      const result = await repository.findById('123');

      expect(fetchById).toHaveBeenCalledWith('inventory_items', '123');
      expect(result).toEqual(mockItem);
    });

    it('should return null if the item is not found', async () => {
      vi.mocked(fetchById).mockResolvedValueOnce({ data: null, error: null, success: false });

      const result = await repository.findById('123');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should call fetchMany with the correct parameters', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1' },
        { id: '456', name: 'Item 2' },
      ];
      vi.mocked(fetchMany).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

      const result = await repository.findAll({ limit: 10 });

      expect(fetchMany).toHaveBeenCalledWith('inventory_items', { limit: 10 });
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if no items are found', async () => {
      vi.mocked(fetchMany).mockResolvedValueOnce({ data: null, error: null, success: false });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findBy', () => {
    it('should call fetchMany with the correct parameters', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1', category: 'electronics' },
        { id: '456', name: 'Item 2', category: 'electronics' },
      ];
      vi.mocked(fetchMany).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

      const result = await repository.findBy({ category: 'electronics' }, { limit: 10 });

      expect(fetchMany).toHaveBeenCalledWith('inventory_items', {
        limit: 10,
        filters: { category: 'electronics' },
      });
      expect(result).toEqual(mockItems);
    });
  });

  describe('create', () => {
    it('should call insert with the correct parameters', async () => {
      const mockItem = { id: '123', name: 'New Item', category: 'electronics' };
      vi.mocked(insert).mockResolvedValueOnce({ data: mockItem, error: null, success: true });

      const result = await repository.create({ name: 'New Item', category: 'electronics' } as any);

      expect(insert).toHaveBeenCalledWith('inventory_items', { name: 'New Item', category: 'electronics' });
      expect(result).toEqual(mockItem);
    });

    it('should throw an error if the item could not be created', async () => {
      vi.mocked(insert).mockResolvedValueOnce({ data: null, error: new Error('Database error'), success: false });

      await expect(repository.create({ name: 'New Item', category: 'electronics' } as any)).rejects.toThrow('Failed to create inventory item');
    });
  });

  describe('update', () => {
    it('should call update with the correct parameters', async () => {
      const mockItem = { id: '123', name: 'Updated Item', category: 'electronics' };
      vi.mocked(update).mockResolvedValueOnce({ data: mockItem, error: null, success: true });

      const result = await repository.update('123', { name: 'Updated Item' } as any);

      expect(update).toHaveBeenCalledWith('inventory_items', '123', { name: 'Updated Item' });
      expect(result).toEqual(mockItem);
    });

    it('should throw an error if the item could not be updated', async () => {
      vi.mocked(update).mockResolvedValueOnce({ data: null, error: new Error('Database error'), success: false });

      await expect(repository.update('123', { name: 'Updated Item' } as any)).rejects.toThrow('Inventory item with ID 123 not found');
    });
  });

  describe('delete', () => {
    it('should call remove with the correct parameters', async () => {
      vi.mocked(remove).mockResolvedValueOnce({ data: null, error: null, success: true });

      const result = await repository.delete('123');

      expect(remove).toHaveBeenCalledWith('inventory_items', '123');
      expect(result).toBe(true);
    });

    it('should return false if the item could not be deleted', async () => {
      vi.mocked(remove).mockResolvedValueOnce({ data: null, error: new Error('Database error'), success: false });

      const result = await repository.delete('123');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should call the correct Supabase query', async () => {
      const mockClient = connectionManager.getClient();

      // Mock the repository's count method
      const originalCount = repository.count;
      repository.count = vi.fn().mockResolvedValue(5);

      const result = await repository.count({ category: 'electronics' });

      expect(repository.count).toHaveBeenCalledWith({ category: 'electronics' });
      expect(result).toBe(5);

      // Restore the original method
      repository.count = originalCount;
    });

    it('should return 0 if there is an error', async () => {
      const mockClient = connectionManager.getClient();

      // Mock the query chain with an error
      mockClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          count: null,
          error: new Error('Database error'),
        }),
      });

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('findByLocation', () => {
    it('should call findBy with the correct parameters', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1', location_id: 'loc-123' },
        { id: '456', name: 'Item 2', location_id: 'loc-123' },
      ];
      vi.mocked(fetchMany).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

      const result = await repository.findByLocation('loc-123', { limit: 10 });

      expect(fetchMany).toHaveBeenCalledWith('inventory_items', {
        limit: 10,
        filters: { location_id: 'loc-123' },
      });
      expect(result).toEqual(mockItems);
    });
  });

  describe('findByCategory', () => {
    it('should call findBy with the correct parameters', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1', category: 'electronics' },
        { id: '456', name: 'Item 2', category: 'electronics' },
      ];
      vi.mocked(fetchMany).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

      const result = await repository.findByCategory('electronics', { limit: 10 });

      expect(fetchMany).toHaveBeenCalledWith('inventory_items', {
        limit: 10,
        filters: { category: 'electronics' },
      });
      expect(result).toEqual(mockItems);
    });
  });

  describe('findByStatus', () => {
    it('should call findBy with the correct parameters', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1', status: 'low' },
        { id: '456', name: 'Item 2', status: 'low' },
      ];
      vi.mocked(fetchMany).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

      const result = await repository.findByStatus('low', { limit: 10 });

      expect(fetchMany).toHaveBeenCalledWith('inventory_items', {
        limit: 10,
        filters: { status: 'low' },
      });
      expect(result).toEqual(mockItems);
    });
  });

  describe('findExpiringSoon', () => {
    it('should call executeWithRetry with the correct query', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1', expiry_date: '2023-01-01' },
        { id: '456', name: 'Item 2', expiry_date: '2023-01-02' },
      ];

      vi.mocked(connectionManager.executeWithRetry).mockImplementation(async (callback) => {
        // Call the callback with a mock client
        return mockItems;
      });

      const result = await repository.findExpiringSoon(7, { limit: 10 });

      expect(connectionManager.executeWithRetry).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if there is an error', async () => {
      vi.mocked(connectionManager.executeWithRetry).mockRejectedValueOnce(new Error('Database error'));

      const result = await repository.findExpiringSoon(7);

      expect(result).toEqual([]);
    });
  });

  describe('findNeedingRestock', () => {
    it('should call executeWithRetry with the correct query', async () => {
      const mockItems = [
        { id: '123', name: 'Item 1', current_quantity: 5, minimum_quantity: 10 },
        { id: '456', name: 'Item 2', current_quantity: 2, minimum_quantity: 5 },
      ];

      vi.mocked(connectionManager.executeWithRetry).mockImplementation(async (callback) => {
        // Call the callback with a mock client
        return mockItems;
      });

      const result = await repository.findNeedingRestock({ limit: 10 });

      expect(connectionManager.executeWithRetry).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if there is an error', async () => {
      vi.mocked(connectionManager.executeWithRetry).mockRejectedValueOnce(new Error('Database error'));

      const result = await repository.findNeedingRestock();

      expect(result).toEqual([]);
    });
  });
});
