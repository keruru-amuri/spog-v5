'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { UserManagement } from '@/components/admin/UserManagement';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { redirect } from 'next/navigation';

export default function AdminUsersPage() {
  const { user, isLoading, hasPermission } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the user is authorized to access this page
    if (!isLoading) {
      const authorized = !!user && hasPermission('manage:users');
      setIsAuthorized(authorized);
      
      if (!authorized && user) {
        // User is logged in but not authorized
        redirect('/dashboard');
      } else if (!authorized && !user) {
        // User is not logged in
        redirect('/');
      }
    }
  }, [user, isLoading, hasPermission]);

  if (isLoading || isAuthorized === null) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions.
          </p>
        </div>
        
        <UserManagement />
      </div>
    </AdminLayout>
  );
}
