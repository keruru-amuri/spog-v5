import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import * as auth from '../../lib/auth';
import { loginSchema, registerSchema, passwordResetRequestSchema, passwordUpdateSchema } from '../../lib/schemas/auth';

// Mock the auth library
jest.mock('../../lib/auth', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  requestPasswordReset: jest.fn(),
  updatePassword: jest.fn(),
  sendEmailVerification: jest.fn(),
}));

// Mock the zod schemas
jest.mock('../../lib/schemas/auth', () => ({
  loginSchema: {
    parse: jest.fn(),
  },
  registerSchema: {
    parse: jest.fn(),
  },
  passwordResetRequestSchema: {
    parse: jest.fn(),
  },
  passwordUpdateSchema: {
    parse: jest.fn(),
  },
}));

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login Endpoint', () => {
    it('should validate login credentials', async () => {
      // Import the route handler
      const { POST } = require('../../app/api/auth/login/route');
      
      // Mock request
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      // Mock the request object
      const request = {
        json: jest.fn().mockResolvedValue(mockCredentials),
      } as unknown as NextRequest;
      
      // Mock the schema validation
      (loginSchema.parse as jest.Mock).mockReturnValue(mockCredentials);
      
      // Mock the login function
      (auth.login as jest.Mock).mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com' },
        token: 'mock-token',
        expiresAt: new Date().toISOString(),
      });
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(loginSchema.parse).toHaveBeenCalledWith(mockCredentials);
      expect(auth.login).toHaveBeenCalledWith(mockCredentials);
    });
    
    it('should handle validation errors', async () => {
      // Import the route handler
      const { POST } = require('../../app/api/auth/login/route');
      
      // Mock request
      const mockCredentials = {
        email: 'invalid-email',
        password: '',
      };
      
      // Mock the request object
      const request = {
        json: jest.fn().mockResolvedValue(mockCredentials),
      } as unknown as NextRequest;
      
      // Mock the schema validation to throw an error
      const validationError = new Error('Validation error');
      validationError.name = 'ZodError';
      (loginSchema.parse as jest.Mock).mockImplementation(() => {
        throw validationError;
      });
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(loginSchema.parse).toHaveBeenCalledWith(mockCredentials);
      expect(auth.login).not.toHaveBeenCalled();
    });
  });
  
  describe('Register Endpoint', () => {
    it('should validate registration data', async () => {
      // Import the route handler
      const { POST } = require('../../app/api/auth/register/route');
      
      // Mock request
      const mockUserData = {
        email: 'new@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        department: 'Engineering',
      };
      
      // Mock the request object
      const request = {
        json: jest.fn().mockResolvedValue(mockUserData),
      } as unknown as NextRequest;
      
      // Mock the schema validation
      (registerSchema.parse as jest.Mock).mockReturnValue(mockUserData);
      
      // Mock the register function
      (auth.register as jest.Mock).mockResolvedValue({
        user: { 
          id: 'user-123', 
          email: 'new@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        token: 'mock-token',
        expiresAt: new Date().toISOString(),
      });
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(registerSchema.parse).toHaveBeenCalledWith(mockUserData);
      expect(auth.register).toHaveBeenCalledWith(mockUserData);
    });
  });
  
  describe('Logout Endpoint', () => {
    it('should logout the user', async () => {
      // Import the route handler
      const { POST } = require('../../app/api/auth/logout/route');
      
      // Mock the request object
      const request = {} as unknown as NextRequest;
      
      // Mock the logout function
      (auth.logout as jest.Mock).mockResolvedValue(undefined);
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Logged out successfully');
      expect(auth.logout).toHaveBeenCalled();
    });
  });
  
  describe('Password Reset Request Endpoint', () => {
    it('should request a password reset', async () => {
      // Import the route handler
      const { POST } = require('../../app/api/auth/password-reset/route');
      
      // Mock request
      const mockRequest = {
        email: 'test@example.com',
      };
      
      // Mock the request object
      const request = {
        json: jest.fn().mockResolvedValue(mockRequest),
      } as unknown as NextRequest;
      
      // Mock the schema validation
      (passwordResetRequestSchema.parse as jest.Mock).mockReturnValue(mockRequest);
      
      // Mock the requestPasswordReset function
      (auth.requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Password reset email sent');
      expect(passwordResetRequestSchema.parse).toHaveBeenCalledWith(mockRequest);
      expect(auth.requestPasswordReset).toHaveBeenCalledWith(mockRequest);
    });
  });
  
  describe('Password Update Endpoint', () => {
    it('should update a password', async () => {
      // Import the route handler
      const { POST } = require('../../app/api/auth/password-update/route');
      
      // Mock request
      const mockRequest = {
        token: 'reset-token',
        password: 'NewPassword123',
      };
      
      // Mock the request object
      const request = {
        json: jest.fn().mockResolvedValue(mockRequest),
      } as unknown as NextRequest;
      
      // Mock the schema validation
      (passwordUpdateSchema.parse as jest.Mock).mockReturnValue(mockRequest);
      
      // Mock the updatePassword function
      (auth.updatePassword as jest.Mock).mockResolvedValue(undefined);
      
      // Call the handler
      const response = await POST(request);
      const data = await response.json();
      
      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message', 'Password updated successfully');
      expect(passwordUpdateSchema.parse).toHaveBeenCalledWith(mockRequest);
      expect(auth.updatePassword).toHaveBeenCalledWith(mockRequest);
    });
  });
});
