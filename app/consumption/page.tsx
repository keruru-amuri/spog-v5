'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ServiceFactory } from '@/services/service-factory';
import { ConsumptionRecord } from '@/services/consumption-service';

export default function ConsumptionPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConsumptionRecords = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const consumptionService = ServiceFactory.getConsumptionService();
        const response = await consumptionService.getConsumptionRecords({
          sort_by: 'recorded_at',
          sort_order: 'desc',
          limit: 50
        });

        if (response.success && response.data) {
          setConsumptionRecords(response.data);
          toast({
            title: 'Consumption Records Loaded',
            description: `Successfully loaded ${response.data.length} consumption records.`,
            duration: 3000,
          });
        } else {
          setError(response.error || 'Failed to fetch consumption records');
          toast({
            title: 'Error',
            description: response.error || 'Failed to fetch consumption records',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsumptionRecords();
  }, [toast]);



  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Consumption History</h1>
            <p className="text-muted-foreground">Track inventory usage over time</p>
          </div>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : consumptionRecords.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No consumption records found. Record usage from the inventory page.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent Consumption Records</CardTitle>
              <CardDescription>History of inventory usage</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consumptionRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.item_name || 'Unknown Item'}</TableCell>
                      <TableCell>{record.quantity} {record.unit}</TableCell>
                      <TableCell>{record.user_name || 'Unknown User'}</TableCell>
                      <TableCell>{new Date(record.recorded_at).toLocaleDateString()} {new Date(record.recorded_at).toLocaleTimeString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
