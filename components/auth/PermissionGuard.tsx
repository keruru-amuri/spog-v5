'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
  fallbackUrl?: string;
}

/**
 * A component that protects content based on user permissions.
 * If the user doesn't have the required permission, it will show a fallback or nothing.
 *
 * @param children The content to render if the user has the permission
 * @param permission The permission required to access the content
 * @param fallback Optional content to render if the user doesn't have the permission
 * @param fallbackUrl Optional URL to link to if the user doesn't have the permission
 */
export function PermissionGuard({
  children,
  permission,
  fallback,
  fallbackUrl = '/dashboard'
}: PermissionGuardProps) {
  const { user, hasPermission } = useAuth();
  
  // If no user or user doesn't have the permission
  if (!user || !hasPermission(permission)) {
    // If a fallback is provided, render it
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // If no fallback is provided but a fallbackUrl is, render a default message with a link
    if (fallbackUrl) {
      return (
        <div className="p-4 border rounded-md bg-muted/50">
          <Alert variant="warning">
            <AlertDescription>
              You don't have permission to access this content. This requires the {permission} permission.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button asChild size="sm" variant="outline">
              <Link href={fallbackUrl}>Go Back</Link>
            </Button>
          </div>
        </div>
      );
    }
    
    // If no fallback or fallbackUrl is provided, render nothing
    return null;
  }
  
  // If the user has the permission, render the children
  return <>{children}</>;
}

export default PermissionGuard;
