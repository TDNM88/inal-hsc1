import { getMongoDb } from './db';
import { comparePassword } from './auth';

type User = {
  _id: string;
  username: string;
  role: string;
  email?: string;
};

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
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

    if (data.success && data.user) {
      return { 
        success: true, 
        user: data.user 
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

export function setAuthSession(user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user));
  }
}

export function getAuthSession(): User | null {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('authUser');
  return user ? JSON.parse(user) : null;
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
  }
}
