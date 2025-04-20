import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionGuard } from '@/components/auth/PermissionGuard';

// Mock useAuth hook
const mockUseAuth = vi.fn();

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user has the required permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', role: 'admin' },
      hasPermission: () => true,
    });

    render(
      <PermissionGuard permission="user:create">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('does not render children when user does not have the required permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', role: 'user' },
      hasPermission: () => false,
    });

    render(
      <PermissionGuard permission="user:create">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders fallback content when provided and user does not have permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', role: 'user' },
      hasPermission: () => false,
    });

    render(
      <PermissionGuard 
        permission="user:create"
        fallback={<div data-testid="fallback-content">Fallback Content</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
  });

  it('renders default message with fallbackUrl when user does not have permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', role: 'user' },
      hasPermission: () => false,
    });

    render(
      <PermissionGuard 
        permission="user:create"
        fallbackUrl="/dashboard"
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText(/You don't have permission to access this content/i)).toBeInTheDocument();
    expect(screen.getByText(/Go Back/i)).toBeInTheDocument();
  });

  it('renders nothing when no fallback or fallbackUrl is provided and user does not have permission', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', role: 'user' },
      hasPermission: () => false,
    });

    const { container } = render(
      <PermissionGuard 
        permission="user:create"
        fallback={null}
        fallbackUrl={undefined}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: () => false,
    });

    const { container } = render(
      <PermissionGuard permission="user:create">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});
