import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
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
jest.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
        getUser: jest.fn(),
        getSession: jest.fn(),
        resend: jest.fn(),
        admin: {
          deleteUser: jest.fn(),
        },
      },
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
            maybeSingle: jest.fn(),
          })),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    },
  };
});

describe('Authentication Utilities', () => {
  describe('login', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should authenticate a user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Mock successful authentication
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'mock-token', expires_at: Date.now() + 3600000 }
        },
        error: null,
      });

      // Mock successful user retrieval
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
            maybeSingle: jest.fn(),
          }),
        }),
        insert: jest.fn(),
        update: jest.fn().mockReturnValue({
          eq: jest.fn(),
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
      jest.clearAllMocks();
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
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            single: jest.fn(),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
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
        update: jest.fn(),
      } as any);

      // Mock successful signup
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
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
      jest.clearAllMocks();
    });

    it('should log out a user', async () => {
      // Mock successful logout
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await expect(logout()).resolves.not.toThrow();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should throw an error if logout fails', async () => {
      // Mock failed logout
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Logout failed', code: 'logout_failed' } as any,
      });

      await expect(logout()).rejects.toThrow(AuthError);
    });
  });

  describe('password reset', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should request a password reset', async () => {
      // Mock successful password reset request
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
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
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: { message: 'Password reset failed', code: 'password_reset_failed' } as any,
      });

      await expect(requestPasswordReset({ email: 'test@example.com' })).rejects.toThrow(AuthError);
    });

    it('should update password with valid token', async () => {
      // Mock successful password update
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
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
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Password update failed', code: 'password_update_failed' } as any,
      });

      await expect(updatePassword({ token: 'valid-token', password: 'newpassword123' })).rejects.toThrow(AuthError);
    });
  });

  describe('user profile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
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

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
            maybeSingle: jest.fn(),
          }),
        }),
        insert: jest.fn(),
        update: jest.fn(),
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
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
            maybeSingle: jest.fn(),
          }),
        }),
        insert: jest.fn(),
        update: jest.fn(),
      } as any);

      await expect(getUserProfile(userId)).rejects.toThrow(AuthError);
    });

    it('should throw an error if database query fails', async () => {
      const userId = 'user-123';

      // Mock database error
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error', code: 'database_error' } as any,
            }),
            maybeSingle: jest.fn(),
          }),
        }),
        insert: jest.fn(),
        update: jest.fn(),
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
      jest.clearAllMocks();
    });

    it('should verify a valid token', async () => {
      // Mock successful token verification
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const isValid = await verifyToken('valid-token');
      expect(isValid).toBe(true);
      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token');
    });

    it('should reject an invalid token', async () => {
      // Mock failed token verification
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token', code: 'invalid_token' } as any,
      });

      const isValid = await verifyToken('invalid-token');
      expect(isValid).toBe(false);
    });
  });

  describe('getCurrentSession', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the current session', async () => {
      // Mock successful session retrieval
      const mockSession = { user: { id: 'user-123' }, expires_at: '2023-12-31' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toEqual(mockSession);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should return null if there is no session', async () => {
      // Mock no session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getCurrentSession();
      expect(session).toBeNull();
    });

    it('should return null if there is an error', async () => {
      // Mock error
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error', code: 'session_error' } as any,
      });

      const session = await getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the current user profile', async () => {
      // Mock successful session retrieval
      const mockSession = { user: { id: 'user-123' }, expires_at: '2023-12-31' };
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
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

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null,
            }),
            maybeSingle: jest.fn(),
          }),
        }),
        insert: jest.fn(),
        update: jest.fn(),
      } as any);

      const user = await getCurrentUser();
      expect(user).toHaveProperty('id', 'user-123');
      expect(user).toHaveProperty('email', 'test@example.com');
      expect(user).toHaveProperty('firstName', 'Test');
      expect(user).toHaveProperty('lastName', 'User');
    });

    it('should return null if there is no session', async () => {
      // Mock no session
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('sendEmailVerification', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should send email verification', async () => {
      // Mock successful email verification
      (supabase.auth.resend as jest.Mock).mockResolvedValue({
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
      (supabase.auth.resend as jest.Mock).mockResolvedValue({
        data: {},
        error: { message: 'Email verification failed', code: 'verification_email_failed' } as any,
      });

      await expect(sendEmailVerification('test@example.com')).rejects.toThrow(AuthError);
    });
  });
});
