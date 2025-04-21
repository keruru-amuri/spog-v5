'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layouts/AppLayout';

export default function ReportsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);

      // Show a toast notification when the page loads
      toast({
        title: 'Reports Loaded',
        description: 'The reports page has been loaded successfully.',
        duration: 3000,
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Inventory Reports</h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">120</div>
                  <p className="text-xs text-muted-foreground">Across 5 categories</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average Stock Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">68%</div>
                  <p className="text-xs text-muted-foreground">Healthy inventory levels</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Items Needing Attention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">5 critical, 7 low stock</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Most Used Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Sealant</div>
                  <p className="text-xs text-muted-foreground">1,250 units used in last 6 months</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="usage" className="space-y-4">
              <TabsList>
                <TabsTrigger value="usage">Usage Trends</TabsTrigger>
                <TabsTrigger value="stock">Stock Levels</TabsTrigger>
                <TabsTrigger value="location">Location Analysis</TabsTrigger>
                <TabsTrigger value="alerts">Expiry Alerts</TabsTrigger>
              </TabsList>

              <TabsContent value="usage" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Consumption</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Chart showing monthly consumption trends would appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Stock Levels</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Chart showing current stock levels would appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Location Utilization</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">Chart showing location utilization would appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Items Expiring Soon</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    <p className="text-muted-foreground">List of items expiring soon would appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => {
                  toast({
                    title: 'Report Generated',
                    description: 'Your report has been generated and is ready for download',
                    variant: 'default',
                  });
                }}
              >
                Generate Report
              </Button>
            </div>
          </>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
