import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutButton } from '@/components/LogoutButton';

// Mock useAuth hook
const mockLogout = vi.fn().mockResolvedValue({ success: true });
const mockUseAuth = vi.fn().mockReturnValue({
  logout: mockLogout,
});

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('LogoutButton', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<LogoutButton />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<LogoutButton showIcon={false} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(<LogoutButton>Sign Out</LogoutButton>);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('calls logout when clicked without confirmation', async () => {
    mockLogout.mockClear();

    render(<LogoutButton showConfirmDialog={false} />);

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /log out/i });

    await user.click(button);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('shows confirmation dialog when showConfirmDialog is true', async () => {
    render(<LogoutButton showConfirmDialog={true} />);

    const user = userEvent.setup();
    const button = screen.getByRole('button', { name: /log out/i });

    await user.click(button);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to log out/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('calls logout when confirmed in dialog', async () => {
    mockLogout.mockClear();

    render(<LogoutButton showConfirmDialog={true} />);

    const user = userEvent.setup();

    // Open the dialog
    await user.click(screen.getByRole('button', { name: /log out/i }));

    // Click the confirm button
    await user.click(screen.getByRole('button', { name: /log out/i, hidden: false }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('does not call logout when canceled in dialog', async () => {
    mockLogout.mockClear();

    render(<LogoutButton showConfirmDialog={true} />);

    const user = userEvent.setup();

    // Open the dialog
    await user.click(screen.getByRole('button', { name: /log out/i }));

    // Click the cancel button
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockLogout).not.toHaveBeenCalled();
  });
});
