'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function ItemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}
