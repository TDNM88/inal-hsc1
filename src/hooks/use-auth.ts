import { useEffect, useState } from 'react';
import { getAuthSession, clearAuthSession } from '@/lib/simple-auth';

type User = {
  _id: string;
  username: string;
  role: string;
  email?: string;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on client-side
    const loadUser = () => {
      const userData = getAuthSession();
      setUser(userData);
      setIsLoading(false);
    };

    // Only run on client-side
    if (typeof window !== 'undefined') {
      loadUser();
    }
  }, []);

  const login = (userData: any) => {
    setUser(userData);
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
