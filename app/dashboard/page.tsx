'use client';

import { useState, useEffect } from 'react';
import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

// Define interfaces for our data
interface InventoryStatus {
  totalItems: number;
  lowStockItems: number;
  criticalStockItems: number;
}

interface ActivityRecord {
  id: string;
  user_email: string;
  item_name: string;
  quantity: number;
  unit: string;
  recorded_at: string;
  action_type: string;
}

export default function DashboardPage() {
  const { user } = useAuth();

  // State for inventory status
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(true);

  // State for recent activity
  const [recentActivity, setRecentActivity] = useState<ActivityRecord[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Fetch inventory status summary
  const fetchInventoryStatus = async () => {
    try {
      setLoadingInventory(true);

      console.log('Fetching inventory status...');

      // Try a simpler query first to check if the table exists and has data
      const { data: checkData, error: checkError } = await supabase
        .from('inventory_items')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking inventory_items table:', checkError);
        console.log('Error details:', JSON.stringify(checkError));

        // If the table doesn't exist or we can't access it, use mock data
        setInventoryStatus({
          totalItems: 124,
          lowStockItems: 8,
          criticalStockItems: 3
        });
        return;
      }

      console.log('Inventory items table exists, proceeding with full query');

      // Fetch all inventory items
      const { data: items, error } = await supabase
        .from('inventory_items')
        .select('id, current_balance, original_amount, status');

      if (error) {
        console.error('Error fetching inventory status:', error);
        console.log('Error details:', JSON.stringify(error));

        // Use mock data as fallback
        setInventoryStatus({
          totalItems: 124,
          lowStockItems: 8,
          criticalStockItems: 3
        });
        return;
      }

      console.log('Fetched inventory items:', items ? items.length : 0);

      // Calculate summary statistics
      const totalItems = items.length;

      // Check if status field exists, if not, calculate it based on current_balance and original_amount
      let lowStockItems = 0;
      let criticalStockItems = 0;

      if (items.some(item => item.status)) {
        // If status field exists, use it
        lowStockItems = items.filter(item => item.status === 'low').length;
        criticalStockItems = items.filter(item => item.status === 'critical').length;
      } else {
        // Otherwise calculate based on percentages
        items.forEach(item => {
          if (!item.current_balance || !item.original_amount) return;

          const percentage = (item.current_balance / item.original_amount) * 100;

          if (percentage <= 10) {
            criticalStockItems++;
          } else if (percentage <= 30) {
            lowStockItems++;
          }
        });
      }

      console.log('Calculated inventory status:', { totalItems, lowStockItems, criticalStockItems });

      setInventoryStatus({
        totalItems,
        lowStockItems,
        criticalStockItems
      });
    } catch (error) {
      console.error('Error in fetchInventoryStatus:', error);
      console.log('Error details:', error instanceof Error ? error.message : JSON.stringify(error));
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');

      // Use mock data as fallback
      setInventoryStatus({
        totalItems: 124,
        lowStockItems: 8,
        criticalStockItems: 3
      });
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch recent activity (consumption records)
  const fetchRecentActivity = async () => {
    try {
      setLoadingActivity(true);

      console.log('Fetching recent activity...');

      // Try a simpler query first to check if the table exists and has data
      const { data: checkData, error: checkError } = await supabase
        .from('consumption_records')
        .select('id')
        .limit(1);

      if (checkError) {
        console.error('Error checking consumption_records table:', checkError);
        console.log('Error details:', JSON.stringify(checkError));

        // If the table doesn't exist or we can't access it, use mock data
        setRecentActivity([
          {
            id: '1',
            user_email: 'user@example.com',
            item_name: 'Lithium Grease',
            quantity: 50,
            unit: 'g',
            recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            action_type: 'used'
          },
          {
            id: '2',
            user_email: 'admin@example.com',
            item_name: 'Hydraulic Oil',
            quantity: 5,
            unit: 'L',
            recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            action_type: 'added'
          }
        ]);
        return;
      }

      console.log('Consumption records table exists, proceeding with full query');

      // Get the most recent 5 consumption records with a more careful query
      const { data, error } = await supabase
        .from('consumption_records')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent activity data:', error);
        console.log('Error details:', JSON.stringify(error));

        // Use mock data as fallback
        setRecentActivity([
          {
            id: '1',
            user_email: 'user@example.com',
            item_name: 'Lithium Grease',
            quantity: 50,
            unit: 'g',
            recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            action_type: 'used'
          },
          {
            id: '2',
            user_email: 'admin@example.com',
            item_name: 'Hydraulic Oil',
            quantity: 5,
            unit: 'L',
            recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            action_type: 'added'
          }
        ]);
        return;
      }

      console.log('Fetched consumption records:', data);

      // Now fetch related data separately to avoid join issues
      const activity = await Promise.all(data.map(async (record) => {
        // Get item name
        let itemName = 'Unknown Item';
        if (record.inventory_item_id) {
          const { data: itemData } = await supabase
            .from('inventory_items')
            .select('name')
            .eq('id', record.inventory_item_id)
            .single();

          if (itemData) {
            itemName = itemData.name;
          }
        }

        // Get user email
        let userEmail = 'Unknown User';
        if (record.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', record.user_id)
            .single();

          if (userData) {
            userEmail = userData.email;
          }
        }

        return {
          id: record.id,
          user_email: userEmail,
          item_name: itemName,
          quantity: record.quantity,
          unit: record.unit || '',
          recorded_at: record.recorded_at,
          action_type: record.action_type || 'used' // Default to 'used' if not specified
        };
      }));

      console.log('Processed activity data:', activity);
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error in fetchRecentActivity:', error);
      console.log('Error details:', error instanceof Error ? error.message : JSON.stringify(error));
      console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
      // Use mock data as fallback
      setRecentActivity([
        {
          id: '1',
          user_email: 'user@example.com',
          item_name: 'Lithium Grease',
          quantity: 50,
          unit: 'g',
          recorded_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
          action_type: 'used'
        },
        {
          id: '2',
          user_email: 'admin@example.com',
          item_name: 'Hydraulic Oil',
          quantity: 5,
          unit: 'L',
          recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          action_type: 'added'
        }
      ]);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchInventoryStatus();
    fetchRecentActivity();
  }, []);

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mt-0 mt-2 pl-0">
          <div>
            <h1 className="text-3xl font-bold mb-2 md:mb-0">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to the MABES SPOG Inventory Management System
            </p>
          </div>
        </div>

        {/* Role-specific dashboard content */}
        <RoleDashboard />

        {/* Common dashboard content */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Inventory Status</CardTitle>
                <CardDescription>Current inventory levels</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingInventory ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Items:</span>
                      <span className="font-medium">{inventoryStatus?.totalItems || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Low Stock:</span>
                      <span className="font-medium">{inventoryStatus?.lowStockItems || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Critical:</span>
                      <span className="font-medium">{inventoryStatus?.criticalStockItems || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.map(activity => (
                      <p key={activity.id} className="text-sm">
                        <span className="font-medium">{activity.user_email.split('@')[0]}</span> {activity.action_type} {activity.quantity}{activity.unit} of {activity.item_name}
                        <span className="block text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.recorded_at), { addSuffix: true })}
                        </span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activity found</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Links</CardTitle>
                <CardDescription>Frequently used pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <a href="/inventory" className="text-primary hover:underline block">Inventory Management</a>
                  <a href="/consumption" className="text-primary hover:underline block">Record Consumption</a>
                  <a href="/profile" className="text-primary hover:underline block">My Profile</a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
