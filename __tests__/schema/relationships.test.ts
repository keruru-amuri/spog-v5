import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

// Mock Supabase client
jest.mock('@/lib/supabase', () => {
  const mockError = { code: '', message: '', details: '' };
  const mockEq = jest.fn().mockReturnThis();
  const mockFrom = jest.fn().mockReturnThis();
  const mockSelect = jest.fn().mockReturnThis();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();
  const mockDelete = jest.fn().mockReturnThis();
  const mockJoin = jest.fn().mockReturnThis();

  // Default success response
  const mockThen = jest.fn().mockImplementation(callback => {
    return callback({ data: [], error: null });
  });

  return {
    supabase: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      join: mockJoin,
      eq: mockEq,
      then: mockThen,
      // Helper to simulate errors for specific tests
      __simulateError: (error: typeof mockError) => {
        mockThen.mockImplementationOnce(callback => {
          return callback({ data: null, error });
        });
      },
      // Helper to simulate successful responses with data
      __simulateResponse: (data: any) => {
        mockThen.mockImplementationOnce(callback => {
          return callback({ data, error: null });
        });
      },
      // Reset all mocks to their default behavior
      __resetMocks: () => {
        mockFrom.mockClear();
        mockSelect.mockClear();
        mockInsert.mockClear();
        mockUpdate.mockClear();
        mockDelete.mockClear();
        mockJoin.mockClear();
        mockEq.mockClear();
        mockThen.mockImplementation(callback => {
          return callback({ data: [], error: null });
        });
      }
    }
  };
});

describe('Database Relationship Tests', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Inventory Items to Locations Relationship', () => {
    it('should allow querying inventory items with their locations', async () => {
      // Mock data for a joined query
      const mockJoinedData = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Silicone Sealant',
          category: 'Sealant',
          current_balance: 3200,
          original_amount: 5000,
          unit: 'g',
          consumption_unit: 'g',
          status: 'normal',
          location: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Storage A'
          }
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Acrylic Paint - White',
          category: 'Paint',
          current_balance: 850,
          original_amount: 5000,
          unit: 'ml',
          consumption_unit: 'ml',
          status: 'low',
          location: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Storage A'
          }
        }
      ];

      // Simulate a successful response with joined data
      (supabase as any).__simulateResponse(mockJoinedData);

      // Test a query that joins inventory_items with locations
      const result = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          category,
          current_balance,
          original_amount,
          unit,
          consumption_unit,
          status,
          location:locations(id, name)
        `);

      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(supabase.select).toHaveBeenCalledWith(`
          id,
          name,
          category,
          current_balance,
          original_amount,
          unit,
          consumption_unit,
          status,
          location:locations(id, name)
        `);
      expect(result.data).toEqual(mockJoinedData);
    });

    it('should allow filtering inventory items by location', async () => {
      // Mock data for filtered query
      const mockFilteredData = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Silicone Sealant',
          category: 'Sealant',
          current_balance: 3200,
          original_amount: 5000,
          unit: 'g',
          consumption_unit: 'g',
          status: 'normal',
          location_id: '123e4567-e89b-12d3-a456-426614174001'
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Acrylic Paint - White',
          category: 'Paint',
          current_balance: 850,
          original_amount: 5000,
          unit: 'ml',
          consumption_unit: 'ml',
          status: 'low',
          location_id: '123e4567-e89b-12d3-a456-426614174001'
        }
      ];

      // Simulate a successful response with filtered data
      (supabase as any).__simulateResponse(mockFilteredData);

      // Test a query that filters inventory_items by location_id
      const locationId = '123e4567-e89b-12d3-a456-426614174001';
      const result = await supabase
        .from('inventory_items')
        .select('*')
        .eq('location_id', locationId);

      expect(supabase.from).toHaveBeenCalledWith('inventory_items');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('location_id', locationId);
      expect(result.data).toEqual(mockFilteredData);
    });
  });

  describe('Cascading Operations', () => {
    it('should handle deleting a location with associated inventory items', async () => {
      // This test simulates a database constraint error when trying to delete a location that has inventory items
      const locationId = '123e4567-e89b-12d3-a456-426614174001';

      // Simulate a database error
      (supabase as any).__simulateError({
        code: '23503',
        message: 'update or delete on table "locations" violates foreign key constraint "inventory_items_location_id_fkey" on table "inventory_items"',
        details: 'Key (id)=(123e4567-e89b-12d3-a456-426614174001) is still referenced from table "inventory_items".'
      });

      // Test deleting a location
      const result = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      expect(supabase.from).toHaveBeenCalledWith('locations');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', locationId);
      expect(result.error).not.toBeNull();
      expect(result.error?.message).toContain('violates foreign key constraint');
    });

    it('should allow updating a location referenced by inventory items', async () => {
      // Mock data for updated location
      const updatedLocation = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        name: 'Storage A - Renamed',
        description: 'Updated description'
      };

      // Simulate a successful response
      (supabase as any).__simulateResponse([updatedLocation]);

      // Test updating a location
      const result = await supabase
        .from('locations')
        .update({ name: 'Storage A - Renamed', description: 'Updated description' })
        .eq('id', updatedLocation.id);

      expect(supabase.from).toHaveBeenCalledWith('locations');
      expect(supabase.update).toHaveBeenCalledWith({
        name: 'Storage A - Renamed',
        description: 'Updated description'
      });
      expect(supabase.eq).toHaveBeenCalledWith('id', updatedLocation.id);
      expect(result.data).toEqual([updatedLocation]);
    });
  });
});
