import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResetPasswordPage from '@/app/reset-password/page';
import { useSearchParams } from 'next/navigation';

// Mock the PasswordUpdateForm component
vi.mock('@/components/forms/PasswordUpdateForm', () => ({
  PasswordUpdateForm: ({ token }: { token: string }) => (
    <div data-testid="password-update-form" data-token={token}>
      Password Update Form
    </div>
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => {
  const actual = vi.importActual('next/navigation');
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

describe('ResetPasswordPage', () => {
  it('renders the reset password page with token', () => {
    // Mock the useSearchParams hook
    const mockGet = vi.fn().mockReturnValue('valid-token');
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
      getAll: vi.fn(),
      has: vi.fn(),
      forEach: vi.fn(),
      entries: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      toString: vi.fn(),
    });

    render(<ResetPasswordPage />);

    // Check for the title
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();

    // Check for the description
    expect(screen.getByText(/enter a new password for your account/i)).toBeInTheDocument();

    // Check for the form with the correct token
    const form = screen.getByTestId('password-update-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-token')).toBe('valid-token');

    // Check for the sign in link
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
  });

  it('shows error message when token is missing', () => {
    // Mock the useSearchParams hook to return null for token
    const mockGet = vi.fn().mockReturnValue(null);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
      getAll: vi.fn(),
      has: vi.fn(),
      forEach: vi.fn(),
      entries: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      toString: vi.fn(),
    });

    render(<ResetPasswordPage />);

    // Check for the error title
    expect(screen.getByText(/invalid reset link/i)).toBeInTheDocument();

    // Check for the error description
    expect(screen.getByText(/the password reset link is invalid or has expired/i)).toBeInTheDocument();

    // Check for the error message
    expect(screen.getByText(/the password reset link is missing a token/i)).toBeInTheDocument();

    // Check for the request new link button (using role to be more specific)
    expect(screen.getByRole('link', { name: /request a new password reset link/i })).toBeInTheDocument();

    // Form should not be rendered
    expect(screen.queryByTestId('password-update-form')).not.toBeInTheDocument();
  });
});
