import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100">404</h1>
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              Go to Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
