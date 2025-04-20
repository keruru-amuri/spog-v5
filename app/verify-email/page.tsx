'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getCurrentUser } = useAuth();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // The email verification is handled by Supabase Auth automatically
        // We just need to check if the user is logged in and redirect accordingly
        const user = await getCurrentUser();
        
        if (user) {
          setIsSuccess(true);
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        } else {
          setIsSuccess(false);
          setError('Unable to verify your email. Please try signing in.');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setIsSuccess(false);
        setError('An error occurred while verifying your email. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyEmail();
  }, [getCurrentUser, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
          <CardDescription>Verifying your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerifying && (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-center">Verifying your email address...</p>
            </div>
          )}
          
          {!isVerifying && isSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-300">
              <AlertDescription>
                Your email has been successfully verified! You will be redirected to the dashboard shortly.
              </AlertDescription>
            </Alert>
          )}
          
          {!isVerifying && !isSuccess && error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {!isVerifying && (
            <div className="space-x-4">
              <Button asChild variant="outline">
                <Link href="/">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
