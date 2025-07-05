import { getMongoDb } from './db';
import { comparePassword } from './auth';

export type User = {
  _id: string;
  username: string;
  role: 'user' | 'admin';
  email?: string;
  isAdmin?: boolean;
  fullName?: string;
  balance?: {
    available: number;
    frozen: number;
  };
  bank?: any;
};

type AuthSession = {
  user: User | null;
  token: string | null;
  role?: 'user' | 'admin';
  isAdmin?: boolean;
};

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string; token?: string }> {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { 
        success: false, 
        error: data.error || 'Đăng nhập thất bại' 
      };
    }

    if (data.success && data.user && data.token) {
      return { 
        success: true, 
        user: data.user,
        token: data.token
      };
    }

    return { 
      success: false, 
      error: 'Đã xảy ra lỗi khi xử lý đăng nhập' 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { 
      success: false, 
      error: 'Không thể kết nối đến máy chủ' 
    };
  }
}

export function setAuthSession(user: User, token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }
}

export async function getAuthSession(): Promise<AuthSession> {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  return {
    user,
    token,
    role: user?.role || 'user',
    isAdmin: user?.role === 'admin'
  };
}

export async function clearAuthSession() {
  if (typeof window === 'undefined') return;
  
  // Clear client-side storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Clear HTTP-only cookie via API
  try {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}
