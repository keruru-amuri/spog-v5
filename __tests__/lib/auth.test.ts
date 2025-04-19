import { 
  login, 
  register, 
  logout, 
  requestPasswordReset, 
  updatePassword,
  getUserProfile,
  hasPermission,
  getPermissionsForRole,
  verifyToken
} from '../../lib/auth';
import { PERMISSIONS } from '../../types/user';

// Mock the supabase client
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  },
}));

describe('Authentication Utilities', () => {
  describe('login', () => {
    it('should authenticate a user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.user.email).toBe(credentials.email);
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
    it('should register a new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        department: 'IT',
      };

      const result = await register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.lastName).toBe(userData.lastName);
      expect(result.user.department).toBe(userData.department);
      expect(result.user.role).toBe('user'); // Default role
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
    it('should log out a user', async () => {
      await expect(logout('mock-jwt-token')).resolves.not.toThrow();
    });
  });

  describe('password reset', () => {
    it('should request a password reset', async () => {
      await expect(requestPasswordReset({ email: 'test@example.com' })).resolves.not.toThrow();
    });

    it('should update password with valid token', async () => {
      await expect(updatePassword({ token: 'valid-token', password: 'newpassword123' })).resolves.not.toThrow();
    });
  });

  describe('user profile', () => {
    it('should get user profile by ID', async () => {
      const userId = 'user-123';
      const profile = await getUserProfile(userId);

      expect(profile).toHaveProperty('id', userId);
      expect(profile).toHaveProperty('email');
      expect(profile).toHaveProperty('firstName');
      expect(profile).toHaveProperty('lastName');
      expect(profile).toHaveProperty('fullName');
      expect(profile).toHaveProperty('role');
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
    it('should verify a valid token', async () => {
      const isValid = await verifyToken('mock-jwt-token');
      expect(isValid).toBe(true);
    });

    it('should reject an invalid token', async () => {
      const isValid = await verifyToken('invalid-token');
      expect(isValid).toBe(false);
    });
  });
});
