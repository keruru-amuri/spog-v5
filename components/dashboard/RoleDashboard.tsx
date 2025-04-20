'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { UserRole } from '@/types/user';

export function RoleDashboard() {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Common dashboard cards for all users */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user.firstName}!</CardTitle>
          <CardDescription>
            You are logged in as a {user.role}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your last login was: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First login'}</p>
        </CardContent>
      </Card>
      
      {/* Admin-specific dashboard cards */}
      {user.role === 'admin' && (
        <>
          <PermissionGuard permission="user:read">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>You can create, update, and deactivate user accounts.</p>
                <a href="/admin/users" className="text-primary hover:underline mt-2 inline-block">
                  Manage Users →
                </a>
              </CardContent>
            </Card>
          </PermissionGuard>
          
          <PermissionGuard permission="report:generate">
            <Card>
              <CardHeader>
                <CardTitle>System Reports</CardTitle>
                <CardDescription>
                  Generate and view reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Access comprehensive system reports and analytics.</p>
                <a href="/reports" className="text-primary hover:underline mt-2 inline-block">
                  View Reports →
                </a>
              </CardContent>
            </Card>
          </PermissionGuard>
        </>
      )}
      
      {/* Manager-specific dashboard cards */}
      {user.role === 'manager' && (
        <>
          <PermissionGuard permission="inventory:read">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>
                  Current inventory status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>View and manage inventory levels across all locations.</p>
                <a href="/inventory" className="text-primary hover:underline mt-2 inline-block">
                  View Inventory →
                </a>
              </CardContent>
            </Card>
          </PermissionGuard>
          
          <PermissionGuard permission="report:generate">
            <Card>
              <CardHeader>
                <CardTitle>Consumption Reports</CardTitle>
                <CardDescription>
                  Track consumption patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>View consumption reports and identify trends.</p>
                <a href="/reports" className="text-primary hover:underline mt-2 inline-block">
                  View Reports →
                </a>
              </CardContent>
            </Card>
          </PermissionGuard>
        </>
      )}
      
      {/* Regular user-specific dashboard cards */}
      {user.role === 'user' && (
        <>
          <PermissionGuard permission="inventory:read">
            <Card>
              <CardHeader>
                <CardTitle>Available Inventory</CardTitle>
                <CardDescription>
                  Items available for use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>View available inventory items that you can request.</p>
                <a href="/inventory" className="text-primary hover:underline mt-2 inline-block">
                  View Inventory →
                </a>
              </CardContent>
            </Card>
          </PermissionGuard>
          
          <PermissionGuard permission="consumption:create">
            <Card>
              <CardHeader>
                <CardTitle>Record Consumption</CardTitle>
                <CardDescription>
                  Log your inventory usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Record your consumption of inventory items.</p>
                <a href="/consumption" className="text-primary hover:underline mt-2 inline-block">
                  Record Usage →
                </a>
              </CardContent>
            </Card>
          </PermissionGuard>
        </>
      )}
    </div>
  );
}

export default RoleDashboard;
