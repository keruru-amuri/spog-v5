import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { inventoryStatusReportQuerySchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';

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

    // Get the user's role from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('Error getting user role:', userError);
      return NextResponse.json(
        { error: 'Unauthorized: User role not found' },
        { status: 401 }
      );
    }

    // Check if user has permission to generate reports
    const { ROLE_PERMISSIONS } = await import('@/types/user');
    const userRole = userData.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    // For now, allow all authenticated users to access reports
    // This can be restricted later if needed
    // if (!permissions.includes('report:generate')) {
    //   return NextResponse.json(
    //     { error: 'Forbidden: You do not have permission to generate reports' },
    //     { status: 403 }
    //   );
    // }

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

    // Query inventory items from Supabase
    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        category,
        location_id,
        current_quantity,
        original_amount,
        minimum_quantity,
        unit,
        created_at,
        updated_at
      `);

    // Apply filters if provided
    if (validatedParams.data.category) {
      query = query.eq('category', validatedParams.data.category);
    }

    if (validatedParams.data.location_id) {
      query = query.eq('location_id', validatedParams.data.location_id);
    }

    // Execute the query
    const { data: inventoryItems, error: inventoryError } = await query;

    if (inventoryError) {
      console.error('Error fetching inventory items:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch inventory items' },
        { status: 500 }
      );
    }

    // Calculate stock status for each item
    const formattedItems = inventoryItems.map(item => {
      const stockPercentage = Math.round((item.current_quantity / item.original_amount) * 100);
      let status = 'normal';

      if (item.current_quantity <= item.minimum_quantity) {
        status = 'low';
      } else if ((item.current_quantity / item.original_amount) * 100 < 10) {
        status = 'critical';
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        location_id: item.location_id,
        current_quantity: item.current_quantity,
        original_amount: item.original_amount,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        stock_percentage: stockPercentage,
        status: status,
        last_updated: item.updated_at || item.created_at,
      };
    });

    // Calculate summary metrics
    const totalItems = formattedItems.length;
    const lowStockItems = formattedItems.filter(item => item.status === 'low').length;
    const criticalStockItems = formattedItems.filter(item => item.status === 'critical').length;
    const averageStockLevel = totalItems > 0
      ? Math.round(formattedItems.reduce((sum, item) => sum + item.stock_percentage, 0) / totalItems)
      : 0;

    // Create report data
    const reportData = {
      report_type: 'inventory-status',
      generated_at: new Date().toISOString(),
      parameters: validatedParams.data,
      summary: {
        total_items: totalItems,
        low_stock_items: lowStockItems,
        critical_stock_items: criticalStockItems,
        average_stock_level: averageStockLevel,
      },
      items: formattedItems,
    };

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
