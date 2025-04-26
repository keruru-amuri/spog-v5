'use client';

import { SideNav } from '@/components/navigation/SideNav';

interface ReportsLayoutProps {
  children: React.ReactNode;
}

export function ReportsLayout({ children }: ReportsLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav />
      <div className="md:pl-64 transition-all duration-200">
        {children}
      </div>
    </div>
  );
}
