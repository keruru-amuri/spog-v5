'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/user';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallbackUrl?: string;
}

/**
 * A component that protects routes by requiring authentication.
 * If the user is not authenticated, they will be redirected to the login page.
 *
 * @param children The content to render if the user is authenticated
 * @param requiredRoles Optional array of roles that are allowed to access the route
 * @param fallbackUrl Optional URL to redirect to if the user doesn't have the required role (defaults to dashboard)
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallbackUrl = '/dashboard'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    // If authenticated but doesn't have the required role, redirect to fallback URL
    if (!isLoading && isAuthenticated && user && requiredRoles && !requiredRoles.includes(user.role)) {
      router.push(fallbackUrl);
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router, fallbackUrl]);

  // Show loading spinner while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated but doesn't have the required role, show access denied message
  if (user && requiredRoles && !requiredRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              You don't have permission to access this page. This area requires {requiredRoles.join(' or ')} privileges.
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button asChild>
              <Link href={fallbackUrl}>Go Back</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated and has the required role (or no role is required), render the children
  return <>{children}</>;
}

export default ProtectedRoute;
