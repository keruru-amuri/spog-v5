import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { reportExportSchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';
import { hasPermission } from '@/lib/auth';

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
    
    // Check if user has permission to export reports
    const canExportReports = await hasPermission(user.id, 'report:export');
    
    if (!canExportReports) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to export reports' },
        { status: 403 }
      );
    }
    
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
    
    // Generate the appropriate report
    let reportData;
    
    switch (report_type) {
      case 'inventory-status':
        reportData = await reportService.generateInventoryStatusReport({
          ...parameters,
          format,
        });
        break;
        
      case 'consumption-trends':
        reportData = await reportService.generateConsumptionTrendsReport({
          ...parameters,
          format,
        });
        break;
        
      case 'expiry':
        reportData = await reportService.generateExpiryReport({
          ...parameters,
          format,
        });
        break;
        
      case 'location-utilization':
        reportData = await reportService.generateLocationUtilizationReport({
          ...parameters,
          format,
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
    
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
