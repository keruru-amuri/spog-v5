import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { locationUtilizationReportQuerySchema } from '@/lib/schemas/reports';
import { ReportService } from '@/services/report-service';

// Create report service instance
const reportService = new ReportService();

/**
 * GET /api/reports/location-utilization
 * Get location utilization report
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
    const validatedParams = locationUtilizationReportQuerySchema.safeParse(queryParams);

    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error.format() },
        { status: 400 }
      );
    }

    // Query locations from Supabase
    let locationsQuery = supabase
      .from('locations')
      .select(`
        id,
        name,
        type
      `);

    // Apply location filter if provided
    if (validatedParams.data.location_id) {
      locationsQuery = locationsQuery.eq('id', validatedParams.data.location_id);
    }

    // Execute the locations query
    const { data: locations, error: locationsError } = await locationsQuery;

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

    // Query inventory items from Supabase
    const { data: inventoryItems, error: inventoryError } = await supabase
      .from('inventory_items')
      .select(`
        id,
        name,
        category,
        location_id,
        current_quantity,
        unit
      `);

    if (inventoryError) {
      console.error('Error fetching inventory items:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch inventory items' },
        { status: 500 }
      );
    }

    // Process location utilization data
    const locationUtilization = locations.map(location => {
      // Get items for this location
      const locationItems = inventoryItems.filter(item => item.location_id === location.id);

      // Skip empty locations if not including them
      if (!validatedParams.data.include_empty && locationItems.length === 0) {
        return null;
      }

      // Calculate total items and quantity
      const totalItems = locationItems.length;
      const totalQuantity = locationItems.reduce((sum, item) => sum + item.current_quantity, 0);

      // Group items by category
      const categoriesMap: Record<string, { item_count: number, total_quantity: number }> = {};

      locationItems.forEach(item => {
        if (!categoriesMap[item.category]) {
          categoriesMap[item.category] = {
            item_count: 0,
            total_quantity: 0,
          };
        }

        categoriesMap[item.category].item_count += 1;
        categoriesMap[item.category].total_quantity += item.current_quantity;
      });

      // Convert categories map to array
      const categories = Object.entries(categoriesMap).map(([category, data]) => ({
        category,
        item_count: data.item_count,
        total_quantity: data.total_quantity,
      }));

      return {
        location_id: location.id,
        location_name: location.name,
        location_type: location.type,
        total_items: totalItems,
        total_quantity: totalQuantity,
        categories: categories,
      };
    }).filter(location => location !== null);

    // Calculate summary metrics
    const totalLocations = locationUtilization.length;
    const totalItems = locationUtilization.reduce((sum, location) => sum + location!.total_items, 0);
    const averageItemsPerLocation = totalLocations > 0 ? Math.round(totalItems / totalLocations) : 0;

    // Create report data
    const reportData = {
      report_type: 'location-utilization',
      generated_at: new Date().toISOString(),
      parameters: validatedParams.data,
      summary: {
        total_locations: totalLocations,
        total_items: totalItems,
        average_items_per_location: averageItemsPerLocation,
      },
      locations: locationUtilization,
    };

    // Return response based on format
    if (validatedParams.data.format === 'csv') {
      const csv = reportService.convertToCSV(reportData);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="location-utilization-report.csv"',
        },
      });
    } else {
      return NextResponse.json(reportData);
    }
  } catch (error) {
    console.error('Error generating location utilization report:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
