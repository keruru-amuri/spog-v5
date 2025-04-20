'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from './DashboardLayout';
import { Card } from '@/components/ui/card';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <DashboardLayout>
      <div className="container py-6">
        <Card className="p-6">
          {children}
        </Card>
      </div>
    </DashboardLayout>
  );
}
