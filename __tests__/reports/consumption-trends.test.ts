import { describe, it, expect, beforeEach } from '@jest/globals';
import { GET } from '@/app/api/reports/consumption-trends/route';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// Mock the createServerClient function
jest.mock('@/lib/supabase-server', () => ({
  createServerClient: jest.fn(),
}));

describe('Consumption Trends API Route', () => {
  let mockRequest: NextRequest;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a mock request
    mockRequest = new NextRequest('http://localhost:3000/api/reports/consumption-trends?group_by=month');

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
      order: jest.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            quantity: 5,
            unit: 'L',
            recorded_at: '2025-01-15T00:00:00.000Z',
            inventory_item_id: 'item-1',
            user_id: 'user-1',
          },
          {
            id: '2',
            quantity: 3,
            unit: 'L',
            recorded_at: '2025-01-20T00:00:00.000Z',
            inventory_item_id: 'item-2',
            user_id: 'user-2',
          },
          {
            id: '3',
            quantity: 2,
            unit: 'kg',
            recorded_at: '2025-02-10T00:00:00.000Z',
            inventory_item_id: 'item-1',
            user_id: 'user-1',
          },
        ],
        error: null,
      }),
    };

    // Mock the createServerClient to return our mock Supabase client
    (createServerClient as any).mockReturnValue(mockSupabase);
  });

  it('should return consumption trends report grouped by month', async () => {
    // Call the API route
    const response = await GET(mockRequest);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('report_type', 'consumption-trends');
    expect(data).toHaveProperty('trends');
    expect(data.trends).toHaveLength(2); // January and February

    // Verify the trends data
    const januaryTrend = data.trends.find((t: any) => t.month === '2025-01');
    const februaryTrend = data.trends.find((t: any) => t.month === '2025-02');

    expect(januaryTrend).toBeDefined();
    expect(januaryTrend.total_quantity).toBe(8); // 5 + 3
    expect(januaryTrend.consumption_count).toBe(2);

    expect(februaryTrend).toBeDefined();
    expect(februaryTrend.total_quantity).toBe(2);
    expect(februaryTrend.consumption_count).toBe(1);

    // Verify the summary data
    expect(data.summary.total_consumption).toBe(10); // 5 + 3 + 2
    expect(data.summary.total_records).toBe(3);
    expect(data.summary.average_per_record).toBe(3.33); // (5 + 3 + 2) / 3 = 3.33
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
