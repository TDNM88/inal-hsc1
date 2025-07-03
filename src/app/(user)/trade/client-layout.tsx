'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

export default function ClientTradeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  
  // Function to handle logout
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render the layout if authenticated
  if (!isAuthenticated()) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-900 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">London SSI</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-300 mr-2" />
              <span className="text-gray-300">{user?.name || user?.email}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-300 hover:text-white" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>
      
      {/* Không bọc children trong container để page có thể tự kiểm soát layout */}
      {children}
    </div>
  );
}
