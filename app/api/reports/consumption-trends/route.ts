import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { consumptionTrendsReportQuerySchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';
import { hasPermission } from '@/lib/auth';

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
    const validatedParams = consumptionTrendsReportQuerySchema.safeParse(queryParams);
    
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }
    
    // Generate report
    const reportData = await reportService.generateConsumptionTrendsReport(validatedParams.data);
    
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
