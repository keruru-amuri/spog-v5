'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ChartLine,
  Legend
} from '@/components/ui/chart';

interface ConsumptionRecord {
  id: string;
  inventory_item_id: string;
  user_id: string;
  quantity: number;
  unit: string;
  recorded_at: string;
  item_name?: string;
  user_email?: string;
}

interface ConsumptionReportProps {
  startDate?: Date;
  endDate?: Date;
  locationId?: string;
}

export function ConsumptionReport({ startDate, endDate, locationId }: ConsumptionReportProps) {
  const [records, setRecords] = useState<ConsumptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch consumption records from Supabase
  const fetchConsumptionRecords = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Default date range if not provided (last 30 days)
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

      console.log('Fetching consumption records...');
      console.log('Date range:', { start: start.toISOString(), end: end.toISOString() });

      // Start building the query
      let query = supabase
        .from('consumption_records')
        .select(`
          id,
          inventory_item_id,
          user_id,
          quantity,
          unit,
          recorded_at,
          inventory_items!inner(name, location_id),
          users(email)
        `)
        .gte('recorded_at', start.toISOString())
        .lte('recorded_at', end.toISOString())
        .order('recorded_at', { ascending: false });

      // Add location filter if provided
      if (locationId) {
        console.log('Filtering by location:', locationId);
        // We need to use a join filter since we're selecting from inventory_items
        query = query.eq('inventory_items.location_id', locationId);
        console.log('Applied location filter to query');
      }

      // Execute the query
      console.log('Executing Supabase query...');
      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Query successful, received data:', data ? `${data.length} records` : 'No data');

      if (!data || data.length === 0) {
        console.log('No consumption records found');
        setRecords([]);
        return;
      }

      // Transform the data to match the ConsumptionRecord interface
      const transformedRecords: ConsumptionRecord[] = data.map(record => ({
        id: record.id,
        inventory_item_id: record.inventory_item_id,
        user_id: record.user_id,
        quantity: record.quantity || 0,
        unit: record.unit || '',
        recorded_at: record.recorded_at,
        item_name: record.inventory_items?.name,
        user_email: record.users?.email
      }));

      console.log('Transformed records:', transformedRecords.length);
      setRecords(transformedRecords);
    } catch (err) {
      console.error('Error fetching consumption records:', err);

      // Provide more detailed error information
      let errorMessage = 'Failed to fetch consumption records';

      if (err instanceof Error) {
        errorMessage = `${errorMessage}: ${err.message}`;
        console.error('Error details:', err.stack);
      } else {
        errorMessage = `${errorMessage}: ${JSON.stringify(err)}`;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchConsumptionRecords();
  }, [startDate, endDate, locationId]);

  // Prepare chart data - group by day
  const prepareChartData = () => {
    const consumptionByDay: Record<string, { date: string; total: number }> = {};

    records.forEach(record => {
      const date = new Date(record.recorded_at).toISOString().split('T')[0];

      if (!consumptionByDay[date]) {
        consumptionByDay[date] = {
          date,
          total: 0
        };
      }

      consumptionByDay[date].total += record.quantity;
    });

    // Convert to array and sort by date
    return Object.values(consumptionByDay).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = prepareChartData();

  // Calculate summary statistics
  const totalConsumption = records.reduce((sum, record) => sum + record.quantity, 0);
  const totalRecords = records.length;
  const averagePerRecord = totalRecords > 0 ? Math.round((totalConsumption / totalRecords) * 100) / 100 : 0;

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-8 w-1/4" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Render the report
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Per Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averagePerRecord.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Consumption Trends</CardTitle>
          <CardDescription>
            {startDate && endDate ? (
              <>From {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}</>
            ) : (
              'Last 30 days'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-6 pb-0">
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ChartContainer
                config={{
                  total: {
                    label: 'Consumption',
                    color: 'hsl(201, 89%, 48%)', // Blue
                  },
                }}
                className="h-full w-full"
              >
                <ChartLine
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  width={500}
                  height={300}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => {
                      // Format date to show only month and day
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-total)"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </ChartLine>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No consumption data available</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm border-t p-6 pt-4">
          <div className="flex gap-2 font-medium leading-none">
            {chartData.length > 1 && (
              <>
                {chartData[chartData.length - 1].total > chartData[0].total ? (
                  <>
                    <span className="text-blue-600">Consumption is trending upward</span>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </>
                ) : chartData[chartData.length - 1].total < chartData[0].total ? (
                  <>
                    <span className="text-green-600">Consumption is trending downward</span>
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  </>
                ) : (
                  <span className="text-muted-foreground">Consumption is stable</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 mr-1" />
            <span>Showing data for {chartData.length} days</span>
          </div>
        </CardFooter>
      </Card>

      {/* Recent Consumption Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consumption Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 10).map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {new Date(record.recorded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">{record.item_name || 'Unknown Item'}</TableCell>
                    <TableCell>{record.user_email || 'Unknown User'}</TableCell>
                    <TableCell>
                      {record.quantity.toFixed(2)} {record.unit}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">No consumption records found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
