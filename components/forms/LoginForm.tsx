'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormValues } from '@/lib/schemas/auth';
import { useAuth } from '@/contexts/AuthContext';
import { AuthError } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const { login, isLoading, error: authError, clearError } = useAuth();

  // Clear server error when auth error changes
  useEffect(() => {
    if (authError) {
      setServerError(null);
    }
  }, [authError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);

    try {
      const result = await login(data);

      if ('error' in result) {
        // Error is already handled in the auth context
        console.error('Login failed:', result.error);

        // Check if it's a deactivated account error
        if (result.error instanceof AuthError && result.error.code === 'account_deactivated') {
          setServerError(
            'Your account has been deactivated. Please contact an administrator for assistance.'
          );
        }
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {(serverError || authError) && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-2">
            <span>{serverError || authError}</span>
            {(serverError?.includes('deactivated') || authError?.includes('deactivated')) && (
              <span className="text-sm">
                If you believe this is an error, please contact the system administrator at{' '}
                <a href="mailto:admin@spog-inventory.com" className="underline hover:no-underline">
                  admin@spog-inventory.com
                </a>
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register('email')}
            aria-invalid={errors.email ? 'true' : 'false'}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register('password')}
            aria-invalid={errors.password ? 'true' : 'false'}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              {...register('rememberMe')}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </Label>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
