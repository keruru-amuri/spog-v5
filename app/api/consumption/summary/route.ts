import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { ConsumptionRecordRepository } from '@/repositories/consumption-record-repository';
import { consumptionSummaryQuerySchema } from '@/lib/schemas/consumption';
import { hasPermission } from '@/lib/auth';

// Create repository instance
const consumptionRecordRepository = new ConsumptionRecordRepository();

/**
 * GET /api/consumption/summary
 * Get consumption summary data
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
