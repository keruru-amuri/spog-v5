import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST as LOGIN_POST } from '../../app/api/auth/login/route';
import { POST as REGISTER_POST } from '../../app/api/auth/register/route';
import { POST as LOGOUT_POST } from '../../app/api/auth/logout/route';
import { POST as PASSWORD_RESET_POST } from '../../app/api/auth/password-reset/route';
import { POST as PASSWORD_UPDATE_POST } from '../../app/api/auth/password-update/route';
import { POST as VERIFY_EMAIL_POST } from '../../app/api/auth/verify-email/route';
import { GET as ME_GET } from '../../app/api/auth/me/route';
import * as auth from '../../lib/auth';
import { UserRepository } from '../../repositories/user-repository';
import { createServerClient } from '../../lib/supabase-server';

// Mock the auth library
jest.mock('../../lib/auth', () => {
  return {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    requestPasswordReset: jest.fn(),
    updatePassword: jest.fn(),
    sendEmailVerification: jest.fn(),
  };
});

// Mock the user repository
jest.mock('../../repositories/user-repository', () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      findById: jest.fn(),
    })),
  };
});

// Mock the supabase server client
jest.mock('../../lib/supabase-server', () => {
  return {
    createServerClient: jest.fn().mockReturnValue({
      auth: {
        getUser: jest.fn(),
      },
    }),
  };
});

// Mock NextRequest
const createMockRequest = (method: string, url: string, body?: any) => {
  const request = {
    method,
    url,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as NextRequest;
  
  return request;
};

describe('Auth API Endpoints', () => {
  let mockUserRepository: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked repository instance
    mockUserRepository = (UserRepository as jest.Mock).mock.results[0]?.value || new UserRepository();
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('POST /api/auth/login', () => {
    it('should login a user with valid credentials', async () => {
      // Mock auth.login
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (auth.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        expiresAt: new Date().toISOString(),
      });
      
      // Create mock request
      const requestBody = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', requestBody);
      
      // Call the handler
      const response = await LOGIN_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUser);
      expect(data.token).toBe('mock-token');
      expect(auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      });
    });
    
    it('should return 400 for invalid request data', async () => {
      // Create mock request with invalid data
      const requestBody = {
        email: 'invalid-email',
        password: '',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', requestBody);
      
      // Call the handler
      const response = await LOGIN_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });
    
    it('should return 401 for authentication error', async () => {
      // Mock auth.login to throw an error
      const authError = new Error('Invalid credentials');
      authError.name = 'AuthError';
      (auth.login as jest.Mock).mockRejectedValue(authError);
      
      // Create mock request
      const requestBody = {
        email: 'test@example.com',
        password: 'wrong-password',
        rememberMe: false,
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', requestBody);
      
      // Call the handler
      const response = await LOGIN_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid credentials');
    });
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      // Mock auth.register
      const mockUser = { id: 'user-123', email: 'new@example.com' };
      (auth.register as jest.Mock).mockResolvedValue({
        user: mockUser,
        token: 'mock-token',
        expiresAt: new Date().toISOString(),
      });
      
      // Create mock request
      const requestBody = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody);
      
      // Call the handler
      const response = await REGISTER_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(data.user).toEqual(mockUser);
      expect(data.token).toBe('mock-token');
      expect(auth.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
      });
    });
    
    it('should return 409 if email already exists', async () => {
      // Mock auth.register to throw an error
      const authError = new Error('Email already exists');
      authError.name = 'AuthError';
      (auth.register as jest.Mock).mockRejectedValue(authError);
      
      // Create mock request
      const requestBody = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', requestBody);
      
      // Call the handler
      const response = await REGISTER_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(data.error).toBe('Email already exists');
    });
  });
  
  describe('POST /api/auth/logout', () => {
    it('should logout a user successfully', async () => {
      // Mock auth.logout
      (auth.logout as jest.Mock).mockResolvedValue(undefined);
      
      // Create mock request
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/logout');
      
      // Call the handler
      const response = await LOGOUT_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged out successfully');
      expect(auth.logout).toHaveBeenCalled();
    });
  });
  
  describe('POST /api/auth/password-reset', () => {
    it('should request a password reset successfully', async () => {
      // Mock auth.requestPasswordReset
      (auth.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      
      // Create mock request
      const requestBody = {
        email: 'test@example.com',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/password-reset', requestBody);
      
      // Call the handler
      const response = await PASSWORD_RESET_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password reset email sent');
      expect(auth.requestPasswordReset).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });
  
  describe('POST /api/auth/password-update', () => {
    it('should update a password successfully', async () => {
      // Mock auth.updatePassword
      (auth.updatePassword as jest.Mock).mockResolvedValue(undefined);
      
      // Create mock request
      const requestBody = {
        token: 'reset-token',
        password: 'new-password',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/password-update', requestBody);
      
      // Call the handler
      const response = await PASSWORD_UPDATE_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Password updated successfully');
      expect(auth.updatePassword).toHaveBeenCalledWith({
        token: 'reset-token',
        password: 'new-password',
      });
    });
  });
  
  describe('POST /api/auth/verify-email', () => {
    it('should send email verification successfully', async () => {
      // Mock auth.sendEmailVerification
      (auth.sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
      
      // Create mock request
      const requestBody = {
        email: 'test@example.com',
      };
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/verify-email', requestBody);
      
      // Call the handler
      const response = await VERIFY_EMAIL_POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Verification email sent');
      expect(auth.sendEmailVerification).toHaveBeenCalledWith('test@example.com');
    });
  });
  
  describe('GET /api/auth/me', () => {
    it('should return the current user profile', async () => {
      // Mock supabase getUser
      const mockSupabase = createServerClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
      
      // Mock user repository
      mockUserRepository.findById.mockResolvedValue({
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        department: 'Engineering',
        role: 'user',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      });
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/me');
      
      // Call the handler
      const response = await ME_GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        department: 'Engineering',
        role: 'user',
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      });
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Mock supabase getUser to return no user
      const mockSupabase = createServerClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/me');
      
      // Call the handler
      const response = await ME_GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
    
    it('should return 403 if user account is deactivated', async () => {
      // Mock supabase getUser
      const mockSupabase = createServerClient();
      (mockSupabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });
      
      // Mock user repository to return inactive user
      mockUserRepository.findById.mockResolvedValue({
        id: 'user-123',
        first_name: 'John',
        last_name: 'Doe',
        department: 'Engineering',
        role: 'user',
        is_active: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      });
      
      // Create mock request
      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/me');
      
      // Call the handler
      const response = await ME_GET(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(403);
      expect(data.error).toBe('Account is deactivated. Please contact an administrator.');
    });
  });
});
