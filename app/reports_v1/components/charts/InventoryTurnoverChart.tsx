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
  LabelList
} from '@/components/ui/chart';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem, getInventoryItems, calculateConsumptionRates } from '../../repositories/inventory-repository';
import { getConsumptionRecords } from '../../repositories/consumption-repository';

interface InventoryTurnoverChartProps {
  category?: string;
  locationId?: string;
}

export function InventoryTurnoverChart({ category, locationId }: InventoryTurnoverChartProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory items and calculate consumption rates
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch inventory items
        const { data: inventoryItems, error: inventoryError } = await getInventoryItems(category, locationId);

        if (inventoryError) {
          setError(inventoryError);
          return;
        }

        // Calculate consumption rates
        const { data: itemsWithRates, error: ratesError } = await calculateConsumptionRates(inventoryItems, 30);

        if (ratesError) {
          setError(ratesError);
          return;
        }

        setItems(itemsWithRates);
      } catch (err) {
        console.error('Error in InventoryTurnoverChart:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [category, locationId]);

  // Calculate turnover rate (consumption / average inventory level)
  const turnoverData = items
    .map(item => {
      const avgInventory = (item.current_balance + item.original_amount) / 2;
      const turnover = avgInventory > 0 && item.consumption_rate ? item.consumption_rate / avgInventory : 0;

      return {
        name: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
        turnover: turnover * 30, // Monthly turnover rate
        category: item.category
      };
    })
    .filter(item => item.turnover > 0) // Only include items with turnover
    .sort((a, b) => b.turnover - a.turnover)
    .slice(0, 10); // Top 10 items

  // Chart configuration
  const chartConfig = {
    turnover: {
      label: 'Turnover Rate',
      color: 'hsl(262, 80%, 50%)', // Purple
    },
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Inventory Turnover Rate</CardTitle>
          <CardDescription>Top 10 fastest moving items (monthly)</CardDescription>
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
          <CardTitle>Inventory Turnover Rate</CardTitle>
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

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Inventory Turnover Rate</CardTitle>
        <CardDescription>Top 10 fastest moving items (monthly)</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-0">
        <div className="h-80 w-full">
          {turnoverData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ChartBars
                layout="vertical"
                data={turnoverData}
                margin={{ top: 20, right: 80, left: 100, bottom: 5 }}
                barSize={20}
                width={500}
                height={300}
              >
                <CartesianGrid horizontal={true} vertical={false} />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="turnover"
                  fill="var(--color-turnover)"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="turnover"
                    position="right"
                    formatter={(value: number) => value.toFixed(2)}
                    style={{ fill: 'hsl(262, 80%, 50%)', fontSize: 12, fontWeight: 500 }}
                  />
                </Bar>
              </ChartBars>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No turnover data available</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t p-6 pt-4">
        <div className="flex gap-2 font-medium leading-none">
          <span>Higher turnover indicates faster-moving inventory</span>
          <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Turnover rate = Monthly consumption / Average inventory level
        </div>
      </CardFooter>
    </Card>
  );
}
