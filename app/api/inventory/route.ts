import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { inventoryItemQuerySchema } from '@/lib/schemas/inventory';
import { ZodError } from 'zod';
import { hasPermission } from '@/lib/auth-server';
import { mockInventoryItems } from './mock-route';

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
      limit = 50,
      offset = 0,
      sort_by = 'name',
      sort_order = 'asc'
    } = validatedParams.data;

    // Filter items based on query parameters
    let filteredItems = [...mockInventoryItems];

    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (location_id) {
      filteredItems = filteredItems.filter(item => item.location_id === location_id);
    }

    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        item.id.toLowerCase().includes(searchLower)
      );
    }

    // Sort items
    filteredItems.sort((a: any, b: any) => {
      const aValue = a[sort_by];
      const bValue = b[sort_by];

      if (aValue < bValue) return sort_order === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort_order === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply pagination
    const totalCount = filteredItems.length;
    const paginatedItems = filteredItems.slice(offset, offset + limit);

    // Return response
    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: (offset + limit) < totalCount
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
    // This is a mock implementation
    return NextResponse.json(
      { error: 'Not implemented' },
      { status: 501 }
    );
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
