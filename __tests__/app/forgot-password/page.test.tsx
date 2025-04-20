import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ForgotPasswordPage from '@/app/forgot-password/page';

// Mock the PasswordResetRequestForm component
vi.mock('@/components/forms/PasswordResetRequestForm', () => ({
  PasswordResetRequestForm: () => <div data-testid="password-reset-request-form">Password Reset Form</div>,
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('ForgotPasswordPage', () => {
  it('renders the forgot password page', () => {
    render(<ForgotPasswordPage />);

    // Check for the title (using exact text match)
    expect(screen.getByText('Reset Your Password')).toBeInTheDocument();

    // Check for the description
    expect(screen.getByText(/enter your email address and we'll send you a link/i)).toBeInTheDocument();

    // Check for the form
    expect(screen.getByTestId('password-reset-request-form')).toBeInTheDocument();

    // Check for the sign in link
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
  });
});
