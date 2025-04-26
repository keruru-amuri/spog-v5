'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ChartBars,
  Legend
} from '@/components/ui/chart';
import { PieChart, Users, AlertCircle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { getConsumptionByDepartment } from '../../repositories/consumption-repository';
import { getUsers } from '../../repositories/user-repository';

interface ConsumptionByDepartmentChartProps {
  startDate?: Date;
  endDate?: Date;
  locationId?: string;
}

export function ConsumptionByDepartmentChart({ startDate, endDate, locationId }: ConsumptionByDepartmentChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departmentTotals, setDepartmentTotals] = useState<Record<string, number>>({});
  const [totalConsumption, setTotalConsumption] = useState(0);

  // Define departments for the chart
  const departments = ['Engineering', 'Maintenance', 'Operations', 'Quality Control'];

  // Fetch consumption data by department
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Set default date range if not provided
        const effectiveStartDate = startDate || new Date(new Date().setMonth(new Date().getMonth() - 6));
        const effectiveEndDate = endDate || new Date();

        console.log('ConsumptionByDepartmentChart: Fetching data with filters:', {
          startDate: effectiveStartDate.toISOString(),
          endDate: effectiveEndDate.toISOString(),
          locationId
        });

        // Fetch consumption data by department
        const { data, error: consumptionError } = await getConsumptionByDepartment(
          effectiveStartDate,
          effectiveEndDate,
          locationId
        );

        console.log('ConsumptionByDepartmentChart: Received data:', data?.length || 0, 'records');

        if (consumptionError) {
          setError(consumptionError);
          return;
        }

        setChartData(data);

        // Calculate totals
        const totals = departments.reduce((acc, dept) => {
          acc[dept] = data.reduce((sum, month) => sum + (month[dept] || 0), 0);
          return acc;
        }, {} as Record<string, number>);

        setDepartmentTotals(totals);
        setTotalConsumption(Object.values(totals).reduce((sum, value) => sum + value, 0));
      } catch (err) {
        console.error('Error in ConsumptionByDepartmentChart:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [startDate, endDate, locationId]);

  // Render loading state
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consumption by Department</CardTitle>
          <CardDescription>Monthly consumption patterns across departments</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pt-6 pb-0">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-80 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Consumption by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    Engineering: {
      label: 'Engineering',
      color: 'hsl(210, 70%, 50%)',
    },
    Maintenance: {
      label: 'Maintenance',
      color: 'hsl(150, 70%, 50%)',
    },
    Operations: {
      label: 'Operations',
      color: 'hsl(30, 70%, 50%)',
    },
    'Quality Control': {
      label: 'Quality Control',
      color: 'hsl(270, 70%, 50%)',
    },
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Consumption by Department</CardTitle>
        <CardDescription>Monthly consumption patterns across departments</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-0">
        <div className="h-80 w-full">
          {chartData.length > 0 && totalConsumption > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ChartBars
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                barSize={30}
                width={500}
                height={300}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                {departments.map(dept => (
                  <Bar
                    key={dept}
                    dataKey={dept}
                    stackId="a"
                    fill={`var(--color-${dept.replace(/\s+/g, '-')})`}
                    radius={[0, 0, 0, 0]}
                  />
                ))}
              </ChartBars>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No consumption data available by department</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t p-6 pt-4">
        <div className="flex gap-2 font-medium leading-none">
          <PieChart className="h-4 w-4" />
          <span>
            {totalConsumption > 0 && Object.entries(departmentTotals)
              .sort(([, a], [, b]) => b - a)[0][0]} uses the most inventory ({
              totalConsumption > 0
                ? Math.round((Object.entries(departmentTotals)
                    .sort(([, a], [, b]) => b - a)[0][1] / totalConsumption) * 100)
                : 0
            }%)
          </span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Users className="h-3.5 w-3.5 mr-1" />
          <span>Compare consumption patterns across departments to identify trends</span>
        </div>
      </CardFooter>
    </Card>
  );
}
