import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { expiryReportQuerySchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';

// Create report service instance
const reportService = new ReportService();

/**
 * GET /api/reports/expiry
 * Get expiry report
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
    const validatedParams = expiryReportQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }

    // Set default days until expiry if not provided
    const daysUntilExpiry = validatedParams.data.days_until_expiry || 30;

    // Calculate the expiry threshold date
    const today = new Date();
    const expiryThreshold = new Date(today);
    expiryThreshold.setDate(today.getDate() + daysUntilExpiry);

    // Query inventory items from Supabase
    let query = supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        category,
        location_id,
        current_quantity,
        unit,
        expiry_date
      `)
      .not('expiry_date', 'is', null);

    // Apply category filter if provided
    if (validatedParams.data.category) {
      query = query.eq('category', validatedParams.data.category);
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

    // Filter items that are expiring within the threshold
    const expiringItems = inventoryItems.filter(item =>
      item.expiry_date && new Date(item.expiry_date) <= expiryThreshold
    );

    // Format items for report
    const formattedItems = expiringItems.map(item => {
      const expiryDate = new Date(item.expiry_date!);
      const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      let status = 'warning';
      if (daysRemaining <= 0) {
        status = 'expired';
      } else if (daysRemaining <= 7) {
        status = 'critical';
      }

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        location_id: item.location_id,
        current_quantity: item.current_quantity,
        unit: item.unit,
        expiry_date: item.expiry_date,
        days_remaining: daysRemaining,
        status: status,
      };
    });

    // Group by expiry status
    const expired = formattedItems.filter(item => item.status === 'expired').length;
    const critical = formattedItems.filter(item => item.status === 'critical').length;
    const warning = formattedItems.filter(item => item.status === 'warning').length;

    // Create report data
    const reportData = {
      report_type: 'expiry',
      generated_at: new Date().toISOString(),
      parameters: validatedParams.data,
      summary: {
        total_expiring_items: formattedItems.length,
        expired_items: expired,
        critical_items: critical,
        warning_items: warning,
      },
      items: formattedItems,
    };

    // Return response based on format
    if (validatedParams.data.format === 'csv') {
      const csv = reportService.convertToCSV(reportData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="expiry-report.csv"',
        },
      });
    } else {
      return NextResponse.json(reportData);
    }
  } catch (error) {
    console.error('Error generating expiry report:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
