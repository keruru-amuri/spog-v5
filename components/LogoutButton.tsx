'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface LogoutButtonProps extends Omit<ButtonProps, 'onClick'> {
  showIcon?: boolean;
  showConfirmDialog?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * A button component that handles user logout
 * 
 * @param showIcon Whether to show the logout icon (default: true)
 * @param showConfirmDialog Whether to show a confirmation dialog before logout (default: true)
 * @param variant Button variant (default: 'ghost')
 * @param size Button size (default: 'default')
 * @param ...props Other button props
 */
export function LogoutButton({
  showIcon = true,
  showConfirmDialog = true,
  variant = 'ghost',
  size = 'default',
  className,
  children,
  ...props
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Redirect is handled in the auth context
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // If no confirmation dialog is needed, render a simple button
  if (!showConfirmDialog) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
        {...props}
      >
        {showIcon && <LogOut className="mr-2 h-4 w-4" />}
        {children || (isLoggingOut ? 'Logging out...' : 'Log out')}
      </Button>
    );
  }

  // If confirmation dialog is needed, render a button with alert dialog
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          {...props}
        >
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          {children || 'Log out'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be logged out of your account and redirected to the login page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default LogoutButton;
