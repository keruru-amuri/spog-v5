import { describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from '@/app/api/reports/inventory-status/route';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Mock the createServerClient function
jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(),
}));

describe('Inventory Status API Route', () => {
  let mockRequest: NextRequest;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a mock request
    mockRequest = new NextRequest('http://localhost:3000/api/reports/inventory-status');

    // Create a mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'test-user-id' },
          },
        }),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      mockResolvedValue: jest.fn(),
    };

    // Mock the user data
    (mockSupabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [{ role: 'admin', permissions: ['report:view'] }],
            error: null,
          }),
        };
      }
      return mockSupabase;
    });

    // Mock the inventory items data
    (mockSupabase.select as jest.Mock).mockImplementation(() => {
      return {
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          data: [
            {
              id: '1',
              name: 'Item 1',
              category: 'Sealant',
              location_id: 'loc-1',
              current_quantity: 80,
              original_amount: 100,
              minimum_quantity: 20,
              unit: 'L',
              created_at: '2025-01-01T00:00:00.000Z',
              updated_at: '2025-01-15T00:00:00.000Z',
            },
            {
              id: '2',
              name: 'Item 2',
              category: 'Paint',
              location_id: 'loc-2',
              current_quantity: 15,
              original_amount: 100,
              minimum_quantity: 20,
              unit: 'L',
              created_at: '2025-01-02T00:00:00.000Z',
              updated_at: '2025-01-16T00:00:00.000Z',
            },
            {
              id: '3',
              name: 'Item 3',
              category: 'Oil',
              location_id: 'loc-1',
              current_quantity: 5,
              original_amount: 100,
              minimum_quantity: 10,
              unit: 'L',
              created_at: '2025-01-03T00:00:00.000Z',
              updated_at: '2025-01-17T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      };
    });

    // Mock the createServerClient to return our mock Supabase client
    (createServerClient as any).mockReturnValue(mockSupabase);
  });

  it('should return inventory status report', async () => {
    // Call the API route
    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('report_type', 'inventory-status');
    expect(data).toHaveProperty('items');
    expect(data.items).toHaveLength(3);

    // Verify the items data
    const item1 = data.items.find((i: any) => i.id === '1');
    const item2 = data.items.find((i: any) => i.id === '2');
    const item3 = data.items.find((i: any) => i.id === '3');

    expect(item1).toBeDefined();
    expect(item1.stock_percentage).toBe(80);
    expect(item1.status).toBe('normal');

    expect(item2).toBeDefined();
    expect(item2.stock_percentage).toBe(15);
    expect(item2.status).toBe('low');

    expect(item3).toBeDefined();
    expect(item3.stock_percentage).toBe(5);
    expect(item3.status).toBe('critical');

    // Verify the summary data
    expect(data.summary.total_items).toBe(3);
    expect(data.summary.low_stock_items).toBe(1);
    expect(data.summary.critical_stock_items).toBe(1);
    expect(data.summary.average_stock_level).toBe(33); // (80 + 15 + 5) / 3 = 33.33
  });

  it('should return 401 if user is not authenticated', async () => {
    // Mock the getUser function to return no user
    (mockSupabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
    });

    // Call the API route
    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error', 'Unauthorized');
  });

  it('should return 403 if user does not have permission', async () => {
    // Mock the from().select() chain to return a user without report:view permission
    (mockSupabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [{ role: 'user', permissions: ['inventory:view'] }],
        error: null,
      }),
    }));

    // Call the API route
    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(403);
    expect(data).toHaveProperty('error', 'Forbidden: You do not have permission to view reports');
  });
});
