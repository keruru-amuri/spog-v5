import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { InventoryItemRepository } from '@/repositories/inventory-item-repository';
import { inventoryItemQuerySchema } from '@/lib/schemas/inventory';
import { ZodError } from 'zod';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const inventoryItemRepository = new InventoryItemRepository();

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get inventory items
 *     description: Get all inventory items with optional filtering
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Sealant, Paint, Oil, Grease]
 *         description: Filter by category
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by location ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [normal, low, critical]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, description, or ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [name, category, current_balance, status, created_at, updated_at]
 *           default: name
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of inventory items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InventoryItem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                     hasMore:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create a new inventory item
 *     description: Create a new inventory item
 *     tags: [Inventory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInventoryItemRequest'
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 item:
 *                   $ref: '#/components/schemas/InventoryItem'
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
