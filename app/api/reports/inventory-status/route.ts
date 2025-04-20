import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { inventoryStatusReportQuerySchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';
import { hasPermission } from '@/lib/auth';

// Create report service instance
const reportService = new ReportService();

/**
 * @swagger
 * /reports/inventory-status:
 *   get:
 *     summary: Get inventory status report
 *     description: Generate a report on the current status of inventory items
 *     tags: [Reports]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Output format
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, normal, low, critical]
 *           default: all
 *         description: Filter by status
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
 *     responses:
 *       200:
 *         description: Inventory status report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InventoryStatusReport'
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
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

    // Check if user has permission to generate reports
    const canGenerateReports = await hasPermission(user.id, 'report:generate');

    if (!canGenerateReports) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to generate reports' },
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
    const validatedParams = inventoryStatusReportQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }

    // Generate report
    const reportData = await reportService.generateInventoryStatusReport(validatedParams.data);

    // Return response based on format
    if (validatedParams.data.format === 'csv') {
      const csv = reportService.convertToCSV(reportData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="inventory-status-report.csv"',
        },
      });
    } else {
      return NextResponse.json(reportData);
    }
  } catch (error) {
    console.error('Error generating inventory status report:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
