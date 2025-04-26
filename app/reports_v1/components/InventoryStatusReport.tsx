'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { InventoryStatusChart } from './InventoryStatusChart';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  current_balance: number;
  original_amount: number;
  unit: string;
  status: 'normal' | 'low' | 'critical';
  location_name?: string;
}

interface InventoryStatusReportProps {
  category?: string;
  locationId?: string;
}

export function InventoryStatusReport({ category, locationId }: InventoryStatusReportProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory items from Supabase
  const fetchInventoryItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching inventory items...');
      console.log('Filters:', { category, locationId });

      // Start building the query
      let query = supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          category,
          location_id,
          current_balance,
          original_amount,
          unit,
          status,
          locations(name)
        `);

      // Apply filters if provided
      if (category) {
        console.log('Applying category filter:', category);
        query = query.eq('category', category);
      }

      if (locationId) {
        console.log('Applying location filter:', locationId);
        query = query.eq('location_id', locationId);
      }

      // Execute the query
      console.log('Executing Supabase query...');
      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      console.log('Query successful, received data:', data ? `${data.length} items` : 'No data');

      if (!data || data.length === 0) {
        console.log('No inventory items found');
        setItems([]);
        return;
      }

      // Transform the data to match the InventoryItem interface
      const transformedItems: InventoryItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        current_balance: item.current_balance || 0,
        original_amount: item.original_amount || 0,
        unit: item.unit || '',
        status: item.status || 'normal',
        location_name: item.locations?.name
      }));

      console.log('Transformed items:', transformedItems.length);
      setItems(transformedItems);
    } catch (err) {
      console.error('Error fetching inventory items:', err);

      // Provide more detailed error information
      let errorMessage = 'Failed to fetch inventory items';

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
    fetchInventoryItems();
  }, [category, locationId]);

  // Calculate summary statistics
  const totalItems = items.length;
  const lowStockItems = items.filter(item => item.status === 'low').length;
  const criticalStockItems = items.filter(item => item.status === 'critical').length;
  const averageStockLevel = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + (item.current_balance / item.original_amount) * 100, 0) / items.length)
    : 0;

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Stock Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageStockLevel}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <InventoryStatusChart items={items} />

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Original Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location_name || 'N/A'}</TableCell>
                    <TableCell>
                      {item.current_balance.toFixed(2)} {item.unit}
                    </TableCell>
                    <TableCell>
                      {item.original_amount.toFixed(2)} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === 'normal'
                            ? 'default'
                            : item.status === 'low'
                            ? 'warning'
                            : 'destructive'
                        }
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">No inventory items found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
