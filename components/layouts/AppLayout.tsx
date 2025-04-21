'use client';

import { SideNav } from '@/components/navigation/SideNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <SideNav />
      <div className="md:pl-64 transition-all duration-200">
        {children}
      </div>
    </div>
  );
}
