'use client';

import { SideNav } from '@/components/navigation/SideNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav />

      {/* Mobile header bar */}
      <div className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center md:hidden">
        <h1 className="text-xl font-bold pl-12">MABES SPOG Inventory</h1>
      </div>

      <div className="md:pl-64 transition-all duration-200">
        {children}
      </div>
    </div>
  );
}
