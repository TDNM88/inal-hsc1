"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  username: string;
  role: string;
  avatar?: string;
  balance: {
    available: number;
    frozen: number;
  };
  bank?: {
    name: string;
    accountNumber: string;
    accountHolder: string;
  };
  verification?: {
    verified: boolean;
    cccdFront: string;
    cccdBack: string;
  };
  status?: {
    active: boolean;
    betLocked: boolean;
    withdrawLocked: boolean;
  };
  createdAt?: string;
  lastLogin?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function useAuthStandalone(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

 const checkAuth = async () => {
  setIsLoading(true);
  try {
    // Lấy token từ localStorage (nếu có)
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    // Gọi API lấy thông tin user, gửi kèm cookie và Authorization header nếu có
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      }
    });
    // Xử lý response
    if (res.ok) {
      const data = await res.json().catch(e => {
        console.error('Error parsing auth response:', e);
        return null;
      });
      if (data?.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  } catch (error) {
    setUser(null);
  } finally {
    setIsLoading(false);
  }
};

  const login = async (username: string, password: string) => {
    try {
      if (!username || !password) {
        return { success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' };
      }
      setUser(null);
      const apiUrl = new URL('/api/login', window.location.origin).toString();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'include',
      });
      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        return { success: false, message: 'Phản hồi không hợp lệ từ máy chủ' };
      }
      if (res.ok && data?.success) {
        const token = data.token || data.accessToken;
        if (token && typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkAuth();
        if (user) {
          return { success: true, message: 'Đăng nhập thành công' };
        }
        return { success: true, message: 'Đăng nhập thành công. Hệ thống đang đồng bộ thông tin...' };
      } else {
        return { success: false, message: data?.message || `Đăng nhập thất bại (Mã lỗi: ${res.status})` };
      }
    } catch (error) {
      return { success: false, message: 'Lỗi không xác định' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      if (typeof window !== 'undefined') localStorage.removeItem('token');
      setUser(null);
    } catch (error) {
      setUser(null);
    }
  };

  const isAuthenticated = () => user !== null;
  const isAdmin = () => user?.role === 'admin';
  const refreshUser = async () => { await checkAuth(); };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    refreshUser,
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthStandalone();
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
