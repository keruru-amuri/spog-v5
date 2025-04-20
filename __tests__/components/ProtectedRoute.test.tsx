import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Mock useAuth hook
const mockUseAuth = vi.fn();

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ProtectedRoute', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: 'user-123', role: 'user' },
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows access denied when user does not have required role', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: 'user-123', role: 'user' },
    });

    render(
      <ProtectedRoute requiredRoles={['admin']}>
        <div>Admin Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to access this page/i)).toBeInTheDocument();
    expect(screen.getByText(/requires admin privileges/i)).toBeInTheDocument();
  });

  it('renders children when user has one of the required roles', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: 'user-123', role: 'manager' },
    });

    render(
      <ProtectedRoute requiredRoles={['admin', 'manager']}>
        <div>Manager Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('Manager Content')).toBeInTheDocument();
  });
});
