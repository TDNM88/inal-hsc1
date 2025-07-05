'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: string;
};

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
    } else if (!isLoading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirect to unauthorized page if user doesn't have required role
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, requiredRole, router, user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect will happen in useEffect
  }

  if (requiredRole && user?.role !== requiredRole) {
    return null; // Redirect will happen in useEffect
  }

  return <>{children}</>;
}
