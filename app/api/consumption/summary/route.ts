import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ConsumptionRecordRepository } from '@/repositories/consumption-record-repository';
import { consumptionSummaryQuerySchema } from '@/lib/schemas/consumption';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const consumptionRecordRepository = new ConsumptionRecordRepository();

/**
 * @swagger
 * /consumption/summary:
 *   get:
 *     summary: Get consumption summary
 *     description: Get summary of consumption records grouped by item or user
 *     tags: [Consumption]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for summary period (ISO format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for summary period (ISO format)
 *       - in: query
 *         name: summary_type
 *         schema:
 *           type: string
 *           enum: [item, user]
 *           default: item
 *         description: Type of summary grouping
 *     responses:
 *       200:
 *         description: Consumption summary data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: array
 *                   items:
 *                     oneOf:
 *                       - type: object
 *                         properties:
 *                           inventory_item_id:
 *                             type: string
 *                             format: uuid
 *                           item_name:
 *                             type: string
 *                           category:
 *                             type: string
 *                           total_quantity:
 *                             type: number
 *                             format: float
 *                           consumption_count:
 *                             type: integer
 *                       - type: object
 *                         properties:
 *                           user_id:
 *                             type: string
 *                             format: uuid
 *                           user_name:
 *                             type: string
 *                           total_quantity:
 *                             type: number
 *                             format: float
 *                           consumption_count:
 *                             type: integer
 *                 period:
 *                   type: object
 *                   properties:
 *                     start_date:
 *                       type: string
 *                       format: date-time
 *                     end_date:
 *                       type: string
 *                       format: date-time
 *                 summary_type:
 *                   type: string
 *                   enum: [item, user]
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

    // Check if user has permission to view consumption records
    const canViewRecords = await hasPermission(user.id, 'consumption:read');

    if (!canViewRecords) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view consumption records' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Validate query parameters
    const validatedParams = consumptionSummaryQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }

    // Extract query options
    const {
      start_date,
      end_date,
      summary_type
    } = validatedParams.data;

    // Set default date range if not provided
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date
      ? new Date(start_date)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days

    // Get consumption summary based on summary type
    let summaryData;

    if (summary_type === 'user') {
      summaryData = await consumptionRecordRepository.getConsumptionSummaryByUser(startDate, endDate);
    } else {
      summaryData = await consumptionRecordRepository.getConsumptionSummaryByItem(startDate, endDate);
    }

    // Return response
    return NextResponse.json({
      summary: summaryData,
      period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      summary_type,
    });
  } catch (error) {
    console.error('Error fetching consumption summary:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
