import {
  fetchById,
  fetchMany,
  insert,
  update,
  remove,
  executeCustomQuery,
  isForeignKeyViolation,
  isUniqueConstraintViolation,
  isCheckConstraintViolation,
  isNotNullViolation,
} from '../../lib/db-utils';
import { connectionManager } from '../../lib/supabase';

// Mock the connection manager
jest.mock('../../lib/supabase', () => {
  return {
    connectionManager: {
      executeWithRetry: jest.fn(),
    },
  };
});

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchById', () => {
    it('should fetch a record by ID successfully', async () => {
      const mockData = { id: '123', name: 'Test Item' };
      (connectionManager.executeWithRetry as jest.Mock).mockResolvedValueOnce(mockData);

      const result = await fetchById('inventory_items', '123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching by ID', async () => {
      const mockError = new Error('Database error');
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await fetchById('inventory_items', '123');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('fetchMany', () => {
    it('should fetch multiple records successfully', async () => {
      const mockData = [
        { id: '123', name: 'Item 1' },
        { id: '456', name: 'Item 2' },
      ];
      (connectionManager.executeWithRetry as jest.Mock).mockResolvedValueOnce(mockData);

      const result = await fetchMany('inventory_items', {
        filters: { category: 'electronics' },
        limit: 10,
        offset: 0,
        orderBy: { column: 'name', ascending: true },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching multiple records', async () => {
      const mockError = new Error('Database error');
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await fetchMany('inventory_items');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('insert', () => {
    it('should insert a record successfully', async () => {
      const mockData = { id: '123', name: 'New Item', category: 'electronics' };
      (connectionManager.executeWithRetry as jest.Mock).mockResolvedValueOnce(mockData);

      const result = await insert('inventory_items', { name: 'New Item', category: 'electronics' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when inserting a record', async () => {
      const mockError = new Error('Database error');
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await insert('inventory_items', { name: 'New Item' });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('update', () => {
    it('should update a record successfully', async () => {
      const mockData = { id: '123', name: 'Updated Item', category: 'electronics' };
      (connectionManager.executeWithRetry as jest.Mock).mockResolvedValueOnce(mockData);

      const result = await update('inventory_items', '123', { name: 'Updated Item' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when updating a record', async () => {
      const mockError = new Error('Database error');
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await update('inventory_items', '123', { name: 'Updated Item' });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('remove', () => {
    it('should remove a record successfully', async () => {
      (connectionManager.executeWithRetry as jest.Mock).mockResolvedValueOnce(null);

      const result = await remove('inventory_items', '123');

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when removing a record', async () => {
      const mockError = new Error('Database error');
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await remove('inventory_items', '123');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('executeCustomQuery', () => {
    it('should execute a custom query successfully', async () => {
      const mockData = [{ count: 5 }];
      (connectionManager.executeWithRetry as jest.Mock).mockResolvedValueOnce(mockData);

      const result = await executeCustomQuery(async (client) => {
        // In a real scenario, this would use the client to execute a custom query
        return mockData;
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(connectionManager.executeWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when executing a custom query', async () => {
      const mockError = new Error('Database error');
      (connectionManager.executeWithRetry as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await executeCustomQuery(async (client) => {
        throw mockError;
      });

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('Error Helpers', () => {
    it('should identify foreign key violations', () => {
      const error = { code: '23503', message: 'Foreign key violation' } as any;
      expect(isForeignKeyViolation(error)).toBe(true);
    });

    it('should identify unique constraint violations', () => {
      const error = { code: '23505', message: 'Unique constraint violation' } as any;
      expect(isUniqueConstraintViolation(error)).toBe(true);
    });

    it('should identify check constraint violations', () => {
      const error = { code: '23514', message: 'Check constraint violation' } as any;
      expect(isCheckConstraintViolation(error)).toBe(true);
    });

    it('should identify not null violations', () => {
      const error = { code: '23502', message: 'Not null violation' } as any;
      expect(isNotNullViolation(error)).toBe(true);
    });
  });
});
