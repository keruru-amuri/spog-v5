'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  login,
  register,
  logout,
  requestPasswordReset,
  updatePassword,
  getCurrentUser,
  sendEmailVerification,
  updateUserProfile,
  hasPermission as checkPermission,
  AuthError
} from '@/lib/auth';
import {
  UserProfile,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordUpdateRequest,
  ProfileUpdateRequest,
  AuthResponse
} from '@/types/user';

// Define the shape of the auth context
interface AuthContextType {
  // State
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Auth functions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  updatePassword: (request: PasswordUpdateRequest) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  getCurrentUser: () => Promise<UserProfile | null>;
  updateProfile: (data: ProfileUpdateRequest) => Promise<UserProfile | null>;

  // Helper functions
  hasPermission: (permission: string) => boolean;
  clearError: () => void;
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  // State
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  // Auth functions (default implementations that will be overridden by the provider)
  login: async () => { throw new Error('AuthContext not initialized'); },
  register: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); },
  requestPasswordReset: async () => { throw new Error('AuthContext not initialized'); },
  updatePassword: async () => { throw new Error('AuthContext not initialized'); },
  sendEmailVerification: async () => { throw new Error('AuthContext not initialized'); },
  getCurrentUser: async () => { throw new Error('AuthContext not initialized'); },
  updateProfile: async () => { throw new Error('AuthContext not initialized'); },

  // Helper functions
  hasPermission: () => false,
  clearError: () => {},
});

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  // State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Router for navigation
  const router = useRouter();

  // Check if the user is authenticated
  const isAuthenticated = !!user;

  // Load the user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login function
  const handleLogin = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await login(credentials);
      setUser(response.user);

      // Redirect to dashboard after successful login
      router.push('/dashboard');
      return response;
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during login');
      }
      // Don't rethrow the error, just return it with the original error object
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const handleRegister = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await register(userData);
      setUser(response.user);

      // Redirect to dashboard after successful registration
      router.push('/dashboard');
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during registration');
      }
      // Don't rethrow the error, just return it
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await logout();
      setUser(null);

      // Redirect to login page after logout
      router.push('/');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during logout');
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Request password reset function
  const handleRequestPasswordReset = async (request: PasswordResetRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      await requestPasswordReset(request);
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while requesting password reset');
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Update password function
  const handleUpdatePassword = async (request: PasswordUpdateRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      await updatePassword(request);
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while updating password');
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Send email verification function
  const handleSendEmailVerification = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await sendEmailVerification(email);
      return { success: true };
    } catch (error) {
      console.error('Email verification error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while sending verification email');
      }
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile function
  const handleUpdateProfile = async (profileData: ProfileUpdateRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('You must be logged in to update your profile');
      }

      const updatedUser = await updateUserProfile(user.id, profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof AuthError) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred while updating your profile');
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if the user has a specific permission
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Create the context value
  const contextValue: AuthContextType = {
    // State
    user,
    isLoading,
    isAuthenticated,
    error,

    // Auth functions
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    requestPasswordReset: handleRequestPasswordReset,
    updatePassword: handleUpdatePassword,
    sendEmailVerification: handleSendEmailVerification,
    getCurrentUser,
    updateProfile: handleUpdateProfile,

    // Helper functions
    hasPermission,
    clearError,
  };

  // Provide the context to children
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

// Export the context for advanced use cases
export default AuthContext;
