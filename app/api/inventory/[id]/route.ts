import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { InventoryItemRepository } from '@/repositories/inventory-item-repository';
import { updateInventoryItemSchema } from '@/lib/schemas/inventory';
import { ZodError } from 'zod';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const inventoryItemRepository = new InventoryItemRepository();

/**
 * GET /api/inventory/:id
 * Get a specific inventory item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params?.id) {
      return NextResponse.json(
        { error: 'Inventory item ID is required' },
        { status: 400 }
      );
    }
    
    // Get inventory item
    const item = await inventoryItemRepository.findById(params.id);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    // Return response
    return NextResponse.json({ item });
  } catch (error) {
    console.error(`Error fetching inventory item ${params?.id}:`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/:id
 * Update an existing inventory item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params?.id) {
      return NextResponse.json(
        { error: 'Inventory item ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Check if user has permission to update inventory items
    const canUpdateItems = await hasPermission(user.id, 'inventory:update');
    
    if (!canUpdateItems) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update inventory items' },
        { status: 403 }
      );
    }
    
    // Check if inventory item exists
    const existingItem = await inventoryItemRepository.findById(params.id);
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const requestData = await request.json();
    
    // Validate request data
    const validatedData = updateInventoryItemSchema.safeParse(requestData);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    // Add updated_by field
    const itemData = {
      ...validatedData.data,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };
    
    // Update inventory item
    const updatedItem = await inventoryItemRepository.update(params.id, itemData);
    
    // Return response
    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    console.error(`Error updating inventory item ${params?.id}:`, error);
    
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
 * DELETE /api/inventory/:id
 * Delete an inventory item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params?.id) {
      return NextResponse.json(
        { error: 'Inventory item ID is required' },
        { status: 400 }
      );
    }
    
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
    
    // Check if user has permission to delete inventory items
    const canDeleteItems = await hasPermission(user.id, 'inventory:delete');
    
    if (!canDeleteItems) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to delete inventory items' },
        { status: 403 }
      );
    }
    
    // Check if inventory item exists
    const existingItem = await inventoryItemRepository.findById(params.id);
    
    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }
    
    // Delete inventory item
    const success = await inventoryItemRepository.delete(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete inventory item' },
        { status: 500 }
      );
    }
    
    // Return response
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting inventory item ${params?.id}:`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
