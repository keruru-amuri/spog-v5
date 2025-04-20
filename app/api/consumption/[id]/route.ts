import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ConsumptionRecordRepository } from '@/repositories/consumption-record-repository';
import { updateConsumptionRecordSchema } from '@/lib/schemas/consumption';
import { ZodError } from 'zod';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const consumptionRecordRepository = new ConsumptionRecordRepository();

/**
 * @swagger
 * /consumption/{id}:
 *   get:
 *     summary: Get a specific consumption record
 *     description: Get details of a specific consumption record by ID
 *     tags: [Consumption]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consumption record ID
 *     responses:
 *       200:
 *         description: Consumption record details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 record:
 *                   $ref: '#/components/schemas/ConsumptionRecord'
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Consumption record not found
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
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params?.id) {
      return NextResponse.json(
        { error: 'Consumption record ID is required' },
        { status: 400 }
      );
    }

    // Get consumption record
    const record = await consumptionRecordRepository.findById(params.id);

    if (!record) {
      return NextResponse.json(
        { error: 'Consumption record not found' },
        { status: 404 }
      );
    }

    // Return response
    return NextResponse.json({ record });
  } catch (error) {
    console.error(`Error fetching consumption record ${params?.id}:`, error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /consumption/{id}:
 *   put:
 *     summary: Update a consumption record
 *     description: Update an existing consumption record
 *     tags: [Consumption]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consumption record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: number
 *                 format: float
 *                 example: 50
 *               unit:
 *                 type: string
 *                 example: 'g'
 *               notes:
 *                 type: string
 *                 example: 'Updated consumption record'
 *               recorded_at:
 *                 type: string
 *                 format: date-time
 *                 example: '2023-04-20T10:00:00Z'
 *     responses:
 *       200:
 *         description: Consumption record updated successfully
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
 *       404:
 *         description: Consumption record not found
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
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params?.id) {
      return NextResponse.json(
        { error: 'Consumption record ID is required' },
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

    // Get the consumption record to check ownership
    const existingRecord = await consumptionRecordRepository.findById(params.id);

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Consumption record not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update this consumption record
    // Users can update their own records within 24 hours, admins can update any record
    const isAdmin = await hasPermission(user.id, 'admin');
    const isOwner = existingRecord.user_id === user.id;
    const isRecent = new Date(existingRecord.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000;

    if (!isAdmin && (!isOwner || !isRecent)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this consumption record' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateConsumptionRecordSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Add updated_by to the record data
    const recordData = {
      ...validatedData.data,
      updated_by: user.id,
    };

    // Update consumption record
    const updatedRecord = await consumptionRecordRepository.update(params.id, recordData);

    // Return response
    return NextResponse.json({ record: updatedRecord });
  } catch (error) {
    console.error(`Error updating consumption record ${params?.id}:`, error);

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
 * /consumption/{id}:
 *   delete:
 *     summary: Delete a consumption record
 *     description: Delete an existing consumption record
 *     tags: [Consumption]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Consumption record ID
 *     responses:
 *       200:
 *         description: Consumption record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Invalid ID
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
 *       404:
 *         description: Consumption record not found
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID
    if (!params?.id) {
      return NextResponse.json(
        { error: 'Consumption record ID is required' },
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

    // Check if user has permission to delete consumption records
    // Only admins can delete consumption records as per the RLS policy
    const isAdmin = await hasPermission(user.id, 'admin');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can delete consumption records' },
        { status: 403 }
      );
    }

    // Get the consumption record to check if it exists
    const existingRecord = await consumptionRecordRepository.findById(params.id);

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Consumption record not found' },
        { status: 404 }
      );
    }

    // Delete consumption record
    const success = await consumptionRecordRepository.delete(params.id);

    // Return response
    return NextResponse.json({ success });
  } catch (error) {
    console.error(`Error deleting consumption record ${params?.id}:`, error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
