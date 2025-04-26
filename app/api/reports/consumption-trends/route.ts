import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { consumptionTrendsReportQuerySchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';
import { cookies } from 'next/headers';

// Create report service instance
const reportService = new ReportService();

/**
 * GET /api/reports/consumption-trends
 * Get consumption trends report
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
    const validatedParams = consumptionTrendsReportQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }

    // Query consumption records from Supabase
    const { data: consumptionRecords, error: consumptionError } = await supabase
      .from('consumption_records')
      .select(`
        id,
        quantity,
        unit,
        recorded_at,
        inventory_item_id,
        user_id
      `)
      .order('recorded_at', { ascending: false });

    if (consumptionError) {
      console.error('Error fetching consumption records:', consumptionError);
      return NextResponse.json(
        { error: 'Failed to fetch consumption records' },
        { status: 500 }
      );
    }

    // Group data by month
    const groupedData: Record<string, any> = {};
    const groupBy = validatedParams.data.group_by || 'month';

    consumptionRecords.forEach(record => {
      let key;
      if (groupBy === 'day') {
        key = new Date(record.recorded_at).toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const date = new Date(record.recorded_at);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        key = weekStart.toISOString().split('T')[0];
      } else { // Default to month
        key = new Date(record.recorded_at).toISOString().substring(0, 7); // YYYY-MM
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          month: key,
          week_start: key,
          total_quantity: 0,
          consumption_count: 0,
        };
      }

      groupedData[key].total_quantity += record.quantity;
      groupedData[key].consumption_count += 1;
    });

    // Convert grouped data to array and sort
    const trends = Object.values(groupedData).sort((a, b) => {
      return a.date.localeCompare(b.date);
    });

    // Calculate summary metrics
    const totalConsumption = consumptionRecords.reduce((sum, record) => sum + record.quantity, 0);
    const totalRecords = consumptionRecords.length;
    const averagePerRecord = totalRecords > 0 ? Math.round((totalConsumption / totalRecords) * 100) / 100 : 0;

    // Create report data
    const reportData = {
      report_type: 'consumption-trends',
      generated_at: new Date().toISOString(),
      parameters: validatedParams.data,
      period: {
        start_date: validatedParams.data.start_date || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
        end_date: validatedParams.data.end_date || new Date().toISOString(),
      },
      summary: {
        total_consumption: totalConsumption,
        total_records: totalRecords,
        average_per_record: averagePerRecord,
      },
      trends: trends,
    };

    // Return response based on format
    if (validatedParams.data.format === 'csv') {
      const csv = reportService.convertToCSV(reportData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="consumption-trends-report.csv"',
        },
      });
    } else {
      return NextResponse.json(reportData);
    }
  } catch (error) {
    console.error('Error generating consumption trends report:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
