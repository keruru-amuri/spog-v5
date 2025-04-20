'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermissionButtonProps extends ButtonProps {
  permission: string;
  tooltipText?: string;
  children: React.ReactNode;
}

/**
 * A button that is only enabled if the user has the required permission.
 * If the user doesn't have the permission, the button is disabled and shows a tooltip.
 *
 * @param permission The permission required to enable the button
 * @param tooltipText Optional text to show in the tooltip when the button is disabled
 * @param children The button content
 * @param props Other button props
 */
export function PermissionButton({
  permission,
  tooltipText = 'You do not have permission to perform this action',
  children,
  ...props
}: PermissionButtonProps) {
  const { hasPermission } = useAuth();
  const hasRequiredPermission = hasPermission(permission);
  
  // If the user has the permission, render a normal button
  if (hasRequiredPermission) {
    return <Button {...props}>{children}</Button>;
  }
  
  // If the user doesn't have the permission, render a disabled button with a tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...props} disabled>
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default PermissionButton;
