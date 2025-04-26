'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
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
  Legend,
  LabelList
} from '@/components/ui/chart';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_balance: number;
  original_amount: number;
  unit: string;
  status: 'normal' | 'low' | 'critical';
}

interface InventoryStatusChartProps {
  items: InventoryItem[];
}

export function InventoryStatusChart({ items }: InventoryStatusChartProps) {
  // Group items by category and calculate totals
  const categoryData = items.reduce((acc, item) => {
    const category = item.category;

    if (!acc[category]) {
      acc[category] = {
        category,
        total: 0,
        normal: 0,
        low: 0,
        critical: 0,
      };
    }

    acc[category].total += 1;

    if (item.status === 'normal') {
      acc[category].normal += 1;
    } else if (item.status === 'low') {
      acc[category].low += 1;
    } else if (item.status === 'critical') {
      acc[category].critical += 1;
    }

    return acc;
  }, {} as Record<string, { category: string; total: number; normal: number; low: number; critical: number; }>);

  // Convert to array for the chart
  const chartData = Object.values(categoryData);

  // Calculate total items and trend
  const totalItems = items.length;
  const normalItems = items.filter(item => item.status === 'normal').length;
  const normalPercentage = totalItems > 0 ? Math.round((normalItems / totalItems) * 100) : 0;

  // Configure chart colors
  const chartConfig = {
    normal: {
      label: 'Normal',
      color: 'hsl(142, 76%, 36%)', // Green
    },
    low: {
      label: 'Low Stock',
      color: 'hsl(38, 92%, 50%)', // Amber
    },
    critical: {
      label: 'Critical',
      color: 'hsl(0, 84%, 60%)', // Red
    },
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Inventory Status by Category</CardTitle>
        <CardDescription>Current inventory levels across categories</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-0">
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ChartBars
                data={chartData}
                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                barGap={2}
                barCategoryGap={16}
                width={500}
                height={300}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Legend />
                <Bar
                  dataKey="normal"
                  fill="var(--color-normal)"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList dataKey="normal" position="top" style={{ fill: 'hsl(142, 76%, 36%)', fontSize: 12, fontWeight: 500 }} />
                </Bar>
                <Bar
                  dataKey="low"
                  fill="var(--color-low)"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList dataKey="low" position="top" style={{ fill: 'hsl(38, 92%, 50%)', fontSize: 12, fontWeight: 500 }} />
                </Bar>
                <Bar
                  dataKey="critical"
                  fill="var(--color-critical)"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList dataKey="critical" position="top" style={{ fill: 'hsl(0, 84%, 60%)', fontSize: 12, fontWeight: 500 }} />
                </Bar>
              </ChartBars>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t p-6 pt-4">
        <div className="flex gap-2 font-medium leading-none">
          {normalPercentage >= 50 ? (
            <>
              <span className="text-green-600">{normalPercentage}% of items have normal stock levels</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </>
          ) : (
            <>
              <span className="text-amber-600">Only {normalPercentage}% of items have normal stock levels</span>
              <TrendingDown className="h-4 w-4 text-amber-600" />
            </>
          )}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing inventory status across {chartData.length} categories
        </div>
      </CardFooter>
    </Card>
  );
}
