import { InventoryItemRepository } from '../../repositories/inventory-item-repository';
import { connectionManager } from '../../lib/supabase';
import { Database } from '../../types/supabase';

// Mock the connection manager
jest.mock('../../lib/supabase', () => {
  return {
    connectionManager: {
      executeWithRetry: jest.fn(),
      getClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        raw: jest.fn().mockReturnValue('minimum_quantity'),
      }),
    },
  };
});

// Mock the db-utils
jest.mock('../../lib/db-utils', () => {
  return {
    fetchById: jest.fn(),
    fetchMany: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
});

// Import the mocked modules
import { fetchById, fetchMany, insert, update, remove } from '../../lib/db-utils';

describe('InventoryItemRepository', () => {
  let repository: InventoryItemRepository;

  beforeEach(() => {
    repository = new InventoryItemRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should call fetchById with the correct parameters', async () => {
      const mockItem = { id: '123', name: 'Test Item' };
      (fetchById as jest.Mock).mockResolvedValueOnce({ data: mockItem, error: null, success: true });

      const result = await repository.findById('123');

      expect(fetchById).toHaveBeenCalledWith('inventory_items', '123');
      expect(result).toEqual(mockItem);
    });

    it('should return null if the item is not found', async () => {
      (fetchById as jest.Mock).mockResolvedValueOnce({ data: null, error: null, success: false });

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
      (fetchMany as jest.Mock).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

      const result = await repository.findAll({ limit: 10 });

      expect(fetchMany).toHaveBeenCalledWith('inventory_items', { limit: 10 });
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if no items are found', async () => {
      (fetchMany as jest.Mock).mockResolvedValueOnce({ data: null, error: null, success: false });

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
      (fetchMany as jest.Mock).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

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
      (insert as jest.Mock).mockResolvedValueOnce({ data: mockItem, error: null, success: true });

      const result = await repository.create({ name: 'New Item', category: 'electronics' } as any);

      expect(insert).toHaveBeenCalledWith('inventory_items', { name: 'New Item', category: 'electronics' });
      expect(result).toEqual(mockItem);
    });

    it('should throw an error if the item could not be created', async () => {
      (insert as jest.Mock).mockResolvedValueOnce({ data: null, error: new Error('Database error'), success: false });

      await expect(repository.create({ name: 'New Item', category: 'electronics' } as any)).rejects.toThrow('Failed to create inventory item');
    });
  });

  describe('update', () => {
    it('should call update with the correct parameters', async () => {
      const mockItem = { id: '123', name: 'Updated Item', category: 'electronics' };
      (update as jest.Mock).mockResolvedValueOnce({ data: mockItem, error: null, success: true });

      const result = await repository.update('123', { name: 'Updated Item' } as any);

      expect(update).toHaveBeenCalledWith('inventory_items', '123', { name: 'Updated Item' });
      expect(result).toEqual(mockItem);
    });

    it('should throw an error if the item could not be updated', async () => {
      (update as jest.Mock).mockResolvedValueOnce({ data: null, error: new Error('Database error'), success: false });

      await expect(repository.update('123', { name: 'Updated Item' } as any)).rejects.toThrow('Inventory item with ID 123 not found');
    });
  });

  describe('delete', () => {
    it('should call remove with the correct parameters', async () => {
      (remove as jest.Mock).mockResolvedValueOnce({ data: null, error: null, success: true });

      const result = await repository.delete('123');

      expect(remove).toHaveBeenCalledWith('inventory_items', '123');
      expect(result).toBe(true);
    });

    it('should return false if the item could not be deleted', async () => {
      (remove as jest.Mock).mockResolvedValueOnce({ data: null, error: new Error('Database error'), success: false });

      const result = await repository.delete('123');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should call the correct Supabase query', async () => {
      const mockClient = connectionManager.getClient();

      // Mock the repository's count method
      const originalCount = repository.count;
      repository.count = jest.fn().mockResolvedValue(5);

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
        select: jest.fn().mockReturnValue({
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
      (fetchMany as jest.Mock).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

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
      (fetchMany as jest.Mock).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

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
      (fetchMany as jest.Mock).mockResolvedValueOnce({ data: mockItems, error: null, success: true });

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

      (connectionManager.executeWithRetry as jest.Mock).mockImplementation(async (callback) => {
        // Call the callback with a mock client
        return mockItems;
      });

      const result = await repository.findExpiringSoon(7, { limit: 10 });

      expect(connectionManager.executeWithRetry).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if there is an error', async () => {
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

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

      (connectionManager.executeWithRetry as jest.Mock).mockImplementation(async (callback) => {
        // Call the callback with a mock client
        return mockItems;
      });

      const result = await repository.findNeedingRestock({ limit: 10 });

      expect(connectionManager.executeWithRetry).toHaveBeenCalled();
      expect(result).toEqual(mockItems);
    });

    it('should return an empty array if there is an error', async () => {
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const result = await repository.findNeedingRestock();

      expect(result).toEqual([]);
    });
  });
});
