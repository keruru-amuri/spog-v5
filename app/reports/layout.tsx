'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      {children}
    </ProtectedRoute>
  );
}
