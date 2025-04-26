import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { reportExportSchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';

// Create report service instance
const reportService = new ReportService();

/**
 * POST /api/reports/export
 * Export a report in the specified format
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

    // Check if user has permission to export reports
    const { ROLE_PERMISSIONS } = await import('@/types/user');
    const userRole = userData.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];

    // For now, allow all authenticated users to export reports
    // This can be restricted later if needed
    // if (!permissions.includes('report:export')) {
    //   return NextResponse.json(
    //     { error: 'Forbidden: You do not have permission to export reports' },
    //     { status: 403 }
    //   );
    // }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = reportExportSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Extract report parameters
    const { report_type, parameters, format } = validatedData.data;

    // Generate the appropriate report by calling the corresponding API route
    let reportData;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const searchParams = new URLSearchParams();

    // Add parameters to search params
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    // Add format parameter
    searchParams.append('format', format);

    // Construct the API URL
    let apiUrl;
    switch (report_type) {
      case 'inventory-status':
        apiUrl = `${baseUrl}/api/reports/inventory-status?${searchParams.toString()}`;
        break;

      case 'consumption-trends':
        apiUrl = `${baseUrl}/api/reports/consumption-trends?${searchParams.toString()}`;
        break;

      case 'expiry':
        apiUrl = `${baseUrl}/api/reports/expiry?${searchParams.toString()}`;
        break;

      case 'location-utilization':
        apiUrl = `${baseUrl}/api/reports/location-utilization?${searchParams.toString()}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    // Call the API route
    const response = await fetch(apiUrl, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to generate ${report_type} report` },
        { status: response.status }
      );
    }

    // Get the report data
    reportData = await response.json();

    // Return response based on format
    if (format === 'csv') {
      const csv = reportService.convertToCSV(reportData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report_type}-report.csv"`,
        },
      });
    } else {
      return NextResponse.json(reportData);
    }
  } catch (error) {
    console.error('Error exporting report:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
