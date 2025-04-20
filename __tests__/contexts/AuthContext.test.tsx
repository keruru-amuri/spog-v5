import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as authUtils from '@/lib/auth';

// Mock the auth utilities
vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
  getCurrentUser: vi.fn(),
  sendEmailVerification: vi.fn(),
  hasPermission: vi.fn(),
  AuthError: class AuthError extends Error {
    code: string;
    constructor(message: string, code: string = 'unknown_error') {
      super(message);
      this.name = 'AuthError';
      this.code = code;
    }
  }
}));

// Mock the next/navigation router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Test component that uses the auth context
function TestComponent() {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    logout,
    hasPermission
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
      <button data-testid="login-button" onClick={() => login({ email: 'test@example.com', password: 'password123' })}>
        Login
      </button>
      <button data-testid="logout-button" onClick={() => logout()}>
        Logout
      </button>
      <div data-testid="has-permission">
        {hasPermission('user:read') ? 'Has Permission' : 'No Permission'}
      </div>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should initialize with loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
  });

  it('should load user on mount', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'user',
      isActive: true,
      emailVerified: true,
    };

    // Mock the getCurrentUser function to return a user
    (authUtils.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for the user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(authUtils.getCurrentUser).toHaveBeenCalledTimes(1);
  });

  it('should handle login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'user',
      isActive: true,
      emailVerified: true,
    };

    // Mock the login function to return a response
    (authUtils.login as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });

    // Mock getCurrentUser to return null initially
    (authUtils.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Click the login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));

    // Should be loading during login
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Should be authenticated with the user
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    expect(authUtils.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle logout', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'user',
      isActive: true,
      emailVerified: true,
    };

    // Mock getCurrentUser to return a user initially
    (authUtils.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    // Mock the logout function
    (authUtils.logout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Should be authenticated initially
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');

    // Click the logout button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('logout-button'));

    // Should be loading during logout
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Wait for logout to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Should be not authenticated after logout
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(authUtils.logout).toHaveBeenCalledTimes(1);
  });

  it('should handle permission checks', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    };

    // Mock getCurrentUser to return a user
    (authUtils.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    // Mock hasPermission to return true for admin
    (authUtils.hasPermission as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Should have permission
    expect(screen.getByTestId('has-permission')).toHaveTextContent('Has Permission');
    expect(authUtils.hasPermission).toHaveBeenCalledWith('admin', 'user:read');
  });

  it('should handle login errors', async () => {
    // Mock getCurrentUser to return null
    (authUtils.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    // Mock login to throw an error
    const mockError = new authUtils.AuthError('Invalid credentials', 'invalid_credentials');
    (authUtils.login as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // We need to handle the error that will be thrown when login fails
    // Set up a spy on console.error to prevent the error from being logged
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Click the login button
    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));

    // Restore console.error
    consoleErrorSpy.mockRestore();

    // Wait for login attempt to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    // Should show the error
    expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not Authenticated');
  });
});
