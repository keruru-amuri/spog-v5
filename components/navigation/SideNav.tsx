'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/user';

export function SideNav() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: null // Everyone can access dashboard
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      permission: PERMISSIONS.INVENTORY_READ
    },
    {
      name: 'Consumption',
      href: '/consumption',
      icon: ShoppingCart,
      permission: PERMISSIONS.CONSUMPTION_READ
    },
    {
      name: 'Reports',
      href: '/reports_v1',
      icon: BarChart2,
      permission: PERMISSIONS.REPORT_GENERATE
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      permission: PERMISSIONS.USER_READ
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: null // Everyone can access settings
    }
  ];

  // Debug user role and permissions
  console.log('Current user:', user);
  console.log('User role:', user?.role);
  console.log('Has USER_READ permission:', hasPermission(PERMISSIONS.USER_READ));
  console.log('Has REPORT_GENERATE permission:', hasPermission(PERMISSIONS.REPORT_GENERATE));

  // Filter navigation items based on user permissions
  const filteredNavItems = navItems.filter(item => {
    const hasAccess = item.permission === null || hasPermission(item.permission);
    console.log(`Menu item ${item.name} has access:`, hasAccess);
    return hasAccess;
  });

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden shadow-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-10 h-10 p-0 flex items-center justify-center"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Hidden on mobile when menu is expanded */}
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold md:block hidden">MABES SPOG Inventory</h1>
            {/* Empty space for mobile */}
            <div className="h-4 md:hidden"></div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
