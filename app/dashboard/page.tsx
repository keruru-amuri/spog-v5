'use client';

import { RoleDashboard } from '@/components/dashboard/RoleDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the SPOG Inventory Management System
          </p>
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Items:</span>
                    <span className="font-medium">124</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Low Stock:</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Critical:</span>
                    <span className="font-medium">3</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">John Doe</span> used 50g of Lithium Grease
                    <span className="block text-xs text-muted-foreground">10 minutes ago</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Jane Smith</span> added 5L of Hydraulic Oil
                    <span className="block text-xs text-muted-foreground">2 hours ago</span>
                  </p>
                </div>
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
