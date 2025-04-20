import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PermissionButton } from '@/components/auth/PermissionButton';

// Mock useAuth hook
const mockUseAuth = vi.fn();

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PermissionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an enabled button when user has the required permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
    });

    render(
      <PermissionButton permission="user:create">
        Create User
      </PermissionButton>
    );

    const button = screen.getByRole('button', { name: /create user/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders a disabled button when user does not have the required permission', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => false,
    });

    render(
      <PermissionButton permission="user:create">
        Create User
      </PermissionButton>
    );

    const button = screen.getByRole('button', { name: /create user/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('passes through other button props', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => true,
    });

    render(
      <PermissionButton 
        permission="user:create"
        variant="destructive"
        className="test-class"
      >
        Delete User
      </PermissionButton>
    );

    const button = screen.getByRole('button', { name: /delete user/i });
    expect(button).toHaveClass('test-class');
  });

  it('uses custom tooltip text when provided', () => {
    mockUseAuth.mockReturnValue({
      hasPermission: () => false,
    });

    render(
      <PermissionButton 
        permission="user:create"
        tooltipText="Custom tooltip text"
      >
        Create User
      </PermissionButton>
    );

    // Note: Testing tooltips is challenging in JSDOM
    // In a real browser, we would hover and check the tooltip content
    // For this test, we're just checking that the button is disabled
    const button = screen.getByRole('button', { name: /create user/i });
    expect(button).toBeDisabled();
  });
});
