'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem, getInventoryItems, calculateConsumptionRates } from '../../repositories/inventory-repository';

interface ReorderForecastChartProps {
  category?: string;
  locationId?: string;
}

export function ReorderForecastChart({ category, locationId }: ReorderForecastChartProps) {
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
        console.error('Error in ReorderForecastChart:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [category, locationId]);

  // Calculate days until reorder point is reached based on consumption rate
  const reorderData = items
    .map(item => {
      const dailyConsumption = item.consumption_rate || 0.01; // Avoid division by zero
      const daysUntilReorder = dailyConsumption > 0
        ? Math.round((item.current_balance - (item.reorder_point || 0)) / dailyConsumption)
        : 999;

      return {
        id: item.id,
        name: item.name,
        current: item.current_balance,
        reorderPoint: item.reorder_point || item.original_amount * 0.3,
        daysUntilReorder: daysUntilReorder,
        category: item.category,
        unit: item.unit
      };
    })
    .filter(item => item.daysUntilReorder < 30 && item.daysUntilReorder > 0) // Items needing reorder within 30 days
    .sort((a, b) => a.daysUntilReorder - b.daysUntilReorder)
    .slice(0, 10); // Top 10 items needing reorder soon

  // Render loading state
  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Reorder Forecast</CardTitle>
          <CardDescription>Items needing reorder within 30 days</CardDescription>
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
          <CardTitle>Reorder Forecast</CardTitle>
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
        <CardTitle>Reorder Forecast</CardTitle>
        <CardDescription>Items needing reorder within 30 days</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-0">
        <div className="h-80 w-full overflow-auto">
          {reorderData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead>Days Until Reorder</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reorderData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.current.toFixed(2)} {item.unit}</TableCell>
                    <TableCell className="text-right">{item.reorderPoint.toFixed(2)} {item.unit}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.daysUntilReorder}</span>
                        <Progress
                          value={Math.min(100, (item.daysUntilReorder / 30) * 100)}
                          className={cn("h-2 w-20",
                            item.daysUntilReorder <= 7
                              ? "[&>div]:bg-red-500"
                              : item.daysUntilReorder <= 14
                                ? "[&>div]:bg-amber-500"
                                : "[&>div]:bg-green-500"
                          )}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        item.daysUntilReorder <= 7
                          ? "destructive"
                          : item.daysUntilReorder <= 14
                            ? "warning"
                            : "default"
                      }>
                        {item.daysUntilReorder <= 7
                          ? "Urgent"
                          : item.daysUntilReorder <= 14
                            ? "Soon"
                            : "Planned"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No items requiring reorder within 30 days</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm border-t p-6 pt-4">
        <div className="flex gap-2 font-medium leading-none">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span>Items requiring attention based on current consumption rates</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-3.5 w-3.5 mr-1" />
          <span>Forecast based on recent consumption patterns</span>
        </div>
      </CardFooter>
    </Card>
  );
}
