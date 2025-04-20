import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  login,
  register,
  logout,
  requestPasswordReset,
  updatePassword,
  getUserProfile,
  hasPermission,
  getPermissionsForRole,
  verifyToken,
  getCurrentUser,
  getCurrentSession,
  sendEmailVerification,
  AuthError
} from '../../lib/auth';
import { PERMISSIONS } from '../../types/user';
import { supabase } from '../../lib/supabase';

// Mock the supabase client
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        getUser: vi.fn(),
        getSession: vi.fn(),
        resend: vi.fn(),
        admin: {
          deleteUser: vi.fn(),
        },
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            maybeSingle: vi.fn(),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    },
  };
});

describe('Authentication Utilities', () => {
  describe('login', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should authenticate a user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock successful authentication
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'mock-token', expires_at: Date.now() + 3600000 }
        },
        error: null,
      });

      // Mock successful user retrieval
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-123',
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                role: 'user',
                is_active: true,
                email_verified: true,
              },
              error: null,
            }),
            maybeSingle: vi.fn(),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn().mockReturnValue({
          eq: vi.fn(),
        }),
      } as any);

      const result = await login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.user.email).toBe(credentials.email);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(credentials);
    });

    it('should throw an error with missing credentials', async () => {
      const credentials = {
        email: '',
        password: '',
      };

      await expect(login(credentials)).rejects.toThrow('Email and password are required');
    });
  });

  describe('register', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        department: 'IT',
      };

      // Mock user check
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            single: vi.fn(),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-123',
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                department: userData.department,
                role: 'user',
                is_active: true,
                email_verified: false,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn(),
      } as any);

      // Mock successful signup
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'mock-token', expires_at: Date.now() + 3600000 }
        },
        error: null,
      });

      const result = await register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.lastName).toBe(userData.lastName);
      expect(result.user.department).toBe(userData.department);
      expect(result.user.role).toBe('user'); // Default role
      expect(supabase.auth.signUp).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should throw an error with missing required fields', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: '',
        lastName: '',
      };

      await expect(register(userData)).rejects.toThrow('All required fields must be provided');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should log out a user', async () => {
      // Mock successful logout
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      });

      await expect(logout()).resolves.not.toThrow();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw an error if logout fails', async () => {
      // Mock failed logout
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Logout failed', code: 'logout_failed' } as any,
      });

      await expect(logout()).rejects.toThrow(AuthError);
    });
  });

  describe('password reset', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should request a password reset', async () => {
      // Mock successful password reset request
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        error: null,
      });

      await expect(requestPasswordReset({ email: 'test@example.com' })).resolves.not.toThrow();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.any(String),
        })
      );
    });

    it('should throw an error if password reset request fails', async () => {
      // Mock failed password reset request
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        error: { message: 'Password reset failed', code: 'password_reset_failed' } as any,
      });

      await expect(requestPasswordReset({ email: 'test@example.com' })).rejects.toThrow(AuthError);
    });

    it('should update password with valid token', async () => {
      // Mock successful password update
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      await expect(updatePassword({ token: 'valid-token', password: 'newpassword123' })).resolves.not.toThrow();
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('should throw an error if password update fails', async () => {
      // Mock failed password update
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Password update failed', code: 'password_update_failed' } as any,
      });

      await expect(updatePassword({ token: 'valid-token', password: 'newpassword123' })).rejects.toThrow(AuthError);
    });
  });

  describe('user profile', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should get user profile by ID', async () => {
      const userId = 'user-123';

      // Mock successful user retrieval
      const mockUserData = {
        id: userId,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: true,
        email_verified: true,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
            maybeSingle: vi.fn(),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
      } as any);

      const profile = await getUserProfile(userId);

      expect(profile).toHaveProperty('id', userId);
      expect(profile).toHaveProperty('email', 'test@example.com');
      expect(profile).toHaveProperty('firstName', 'Test');
      expect(profile).toHaveProperty('lastName', 'User');
      expect(profile).toHaveProperty('fullName', 'Test User');
      expect(profile).toHaveProperty('role', 'user');

      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should throw an error if user is not found', async () => {
      const userId = 'nonexistent-user';

      // Mock user not found
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            maybeSingle: vi.fn(),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
      } as any);

      await expect(getUserProfile(userId)).rejects.toThrow(AuthError);
    });

    it('should throw an error if database query fails', async () => {
      const userId = 'user-123';

      // Mock database error
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'database_error' } as any,
            }),
            maybeSingle: vi.fn(),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
      } as any);

      await expect(getUserProfile(userId)).rejects.toThrow(AuthError);
    });
  });

  describe('permissions', () => {
    it('should check if user has permission', () => {
      // Admin should have all permissions
      expect(hasPermission('admin', PERMISSIONS.USER_CREATE)).toBe(true);
      expect(hasPermission('admin', PERMISSIONS.INVENTORY_DELETE)).toBe(true);

      // Manager should have inventory permissions but not user management
      expect(hasPermission('manager', PERMISSIONS.INVENTORY_CREATE)).toBe(true);
      expect(hasPermission('manager', PERMISSIONS.USER_CREATE)).toBe(false);

      // Regular user should have limited permissions
      expect(hasPermission('user', PERMISSIONS.INVENTORY_READ)).toBe(true);
      expect(hasPermission('user', PERMISSIONS.INVENTORY_DELETE)).toBe(false);
    });

    it('should get all permissions for a role', () => {
      const adminPermissions = getPermissionsForRole('admin');
      const managerPermissions = getPermissionsForRole('manager');
      const userPermissions = getPermissionsForRole('user');

      // Admin should have the most permissions
      expect(adminPermissions.length).toBeGreaterThan(managerPermissions.length);
      expect(managerPermissions.length).toBeGreaterThan(userPermissions.length);

      // Check specific permissions
      expect(adminPermissions).toContain(PERMISSIONS.USER_CREATE);
      expect(managerPermissions).toContain(PERMISSIONS.INVENTORY_CREATE);
      expect(userPermissions).toContain(PERMISSIONS.INVENTORY_READ);
    });
  });

  describe('token verification', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should verify a valid token', async () => {
      // Mock successful token verification
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const isValid = await verifyToken('valid-token');
      expect(isValid).toBe(true);
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
    });

    it('should reject an invalid token', async () => {
      // Mock failed token verification
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', code: 'invalid_token' } as any,
      });

      const isValid = await verifyToken('invalid-token');
      expect(isValid).toBe(false);
    });
  });

  describe('getCurrentSession', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return the current session', async () => {
      // Mock successful session retrieval
      const mockSession = { user: { id: 'user-123' }, expires_at: '2023-12-31' };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toEqual(mockSession);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should return null if there is no session', async () => {
      // Mock no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toBeNull();
    });

    it('should return null if there is an error', async () => {
      // Mock error
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error', code: 'session_error' } as any,
      });

      const session = await getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return the current user profile', async () => {
      // Mock successful session retrieval
      const mockSession = { user: { id: 'user-123' }, expires_at: '2023-12-31' };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Mock successful user retrieval
      const mockUserData = {
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: true,
        email_verified: true,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
            maybeSingle: vi.fn(),
          }),
        }),
        insert: vi.fn(),
        update: vi.fn(),
      } as any);

      const user = await getCurrentUser();
      expect(user).toHaveProperty('id', 'user-123');
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(user).toHaveProperty('firstName', 'Test');
      expect(user).toHaveProperty('lastName', 'User');
    });

    it('should return null if there is no session', async () => {
      // Mock no session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('sendEmailVerification', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should send email verification', async () => {
      // Mock successful email verification
      vi.mocked(supabase.auth.resend).mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(sendEmailVerification('test@example.com')).resolves.not.toThrow();
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
        options: expect.objectContaining({
          emailRedirectTo: expect.any(String),
        }),
      });
    });

    it('should throw an error if email verification fails', async () => {
      // Mock failed email verification
      vi.mocked(supabase.auth.resend).mockResolvedValue({
        data: {},
        error: { message: 'Email verification failed', code: 'verification_email_failed' } as any,
      });

      await expect(sendEmailVerification('test@example.com')).rejects.toThrow(AuthError);
    });
  });
});
