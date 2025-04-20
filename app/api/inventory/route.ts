import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { InventoryItemRepository } from '@/repositories/inventory-item-repository';
import { inventoryItemQuerySchema } from '@/lib/schemas/inventory';
import { ZodError } from 'zod';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const inventoryItemRepository = new InventoryItemRepository();

/**
 * GET /api/inventory
 * Get all inventory items with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Validate query parameters
    const validatedParams = inventoryItemQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }
    
    // Extract query options
    const { 
      category, 
      location_id, 
      status, 
      search,
      limit, 
      offset, 
      sort_by, 
      sort_order 
    } = validatedParams.data;
    
    // Create filter object
    const filter: Record<string, any> = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (location_id) {
      filter.location_id = location_id;
    }
    
    if (status) {
      filter.status = status;
    }
    
    // Create query options
    const options = {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: sort_by ? {
        column: sort_by,
        ascending: sort_order !== 'desc'
      } : undefined
    };
    
    // Get inventory items
    let items;
    
    if (search) {
      // If search parameter is provided, use custom search method
      items = await inventoryItemRepository.search(search, options);
    } else {
      // Otherwise, use standard findBy method
      items = await inventoryItemRepository.findBy(filter, options);
    }
    
    // Get total count for pagination
    const totalCount = await inventoryItemRepository.count(filter);
    
    // Return response
    return NextResponse.json({
      items,
      pagination: {
        total: totalCount,
        limit: options.limit,
        offset: options.offset,
        hasMore: (options.offset + options.limit) < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/inventory
 * Create a new inventory item
 */
export async function POST(request: NextRequest) {
  try {
    // Create a Supabase server client
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create inventory items
    const canCreateItems = await hasPermission(user.id, 'inventory:create');
    
    if (!canCreateItems) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to create inventory items' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Validate request data
    const { createInventoryItemSchema } = await import('@/lib/schemas/inventory');
    const validatedData = createInventoryItemSchema.safeParse(requestData);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    // Add created_by field
    const itemData = {
      ...validatedData.data,
      created_by: user.id
    };
    
    // Create inventory item
    const item = await inventoryItemRepository.create(itemData);
    
    // Return response
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.format() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
