import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ConsumptionRecordRepository } from '@/repositories/consumption-record-repository';
import { consumptionRecordQuerySchema, createConsumptionRecordSchema } from '@/lib/schemas/consumption';
import { ZodError } from 'zod';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const consumptionRecordRepository = new ConsumptionRecordRepository();

/**
 * @swagger
 * /consumption:
 *   get:
 *     summary: Get consumption records
 *     description: Get consumption records with optional filtering
 *     tags: [Consumption]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: inventory_item_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by inventory item ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO format)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [recorded_at, quantity, created_at]
 *           default: recorded_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of consumption records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConsumptionRecord'
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
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Validate query parameters
    const validatedParams = consumptionRecordQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }

    // Extract query options
    const {
      inventory_item_id,
      user_id,
      start_date,
      end_date,
      limit,
      offset,
      sort_by,
      sort_order
    } = validatedParams.data;

    // Set up query options
    const options = {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: sort_by ? {
        column: sort_by,
        ascending: sort_order !== 'desc',
      } : undefined,
    };

    // Get consumption records based on filters
    let records = [];
    let total = 0;

    if (inventory_item_id) {
      // Filter by inventory item
      records = await consumptionRecordRepository.findByInventoryItem(inventory_item_id, options);
      total = await consumptionRecordRepository.count({ inventory_item_id });
    } else if (user_id) {
      // Filter by user
      records = await consumptionRecordRepository.findByUser(user_id, options);
      total = await consumptionRecordRepository.count({ user_id });
    } else if (start_date && end_date) {
      // Filter by date range
      records = await consumptionRecordRepository.findByDateRange(
        new Date(start_date),
        new Date(end_date),
        options
      );
      // Count is more complex for date range, so we'll estimate based on results
      total = records.length < options.limit ? records.length : options.limit * 2;
    } else {
      // No specific filters, get all records
      records = await consumptionRecordRepository.findAll(options);
      total = await consumptionRecordRepository.count();
    }

    // Return response with pagination info
    return NextResponse.json({
      records,
      pagination: {
        total,
        limit: options.limit,
        offset: options.offset,
        hasMore: total > options.offset + records.length,
      },
    });
  } catch (error) {
    console.error('Error fetching consumption records:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /consumption:
 *   post:
 *     summary: Create a new consumption record
 *     description: Record consumption of an inventory item
 *     tags: [Consumption]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConsumptionRecordRequest'
 *     responses:
 *       201:
 *         description: Consumption record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 record:
 *                   $ref: '#/components/schemas/ConsumptionRecord'
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

    // Check if user has permission to create consumption records
    const canCreateRecords = await hasPermission(user.id, 'consumption:create');

    if (!canCreateRecords) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to create consumption records' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createConsumptionRecordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Add user ID to the record
    const recordData = {
      ...validatedData.data,
      user_id: user.id,
    };

    // Create consumption record
    const record = await consumptionRecordRepository.create(recordData);

    // Return response
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error('Error creating consumption record:', error);

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
