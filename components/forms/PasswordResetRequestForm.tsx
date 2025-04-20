'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetRequestSchema, PasswordResetRequestFormValues } from '@/lib/schemas/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PasswordResetRequestFormProps {
  onSuccess?: () => void;
}

export function PasswordResetRequestForm({ onSuccess }: PasswordResetRequestFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { requestPasswordReset, isLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordResetRequestFormValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: {
      email: '',
    },
  });
  
  const onSubmit = async (data: PasswordResetRequestFormValues) => {
    setServerError(null);
    setIsSuccess(false);
    
    try {
      const result = await requestPasswordReset(data);
      
      if ('error' in result) {
        // Error is already handled in the auth context
        console.error('Password reset request failed:', result.error);
      } else {
        setIsSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Unexpected error during password reset request:', error);
      setServerError('An unexpected error occurred. Please try again.');
    }
  };
  
  return (
    <div className="space-y-6">
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}
      
      {isSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-300">
          <AlertDescription>
            If an account exists with that email, we've sent password reset instructions.
            Please check your email.
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
        
        <Button type="submit" className="w-full" disabled={isLoading || isSuccess}>
          {isLoading ? 'Sending...' : 'Send Reset Instructions'}
        </Button>
      </form>
    </div>
  );
}
