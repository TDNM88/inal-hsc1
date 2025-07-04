import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user';
  fullName?: string;
  balance?: {
    available: number;
    frozen: number;
  };
}

/**
 * Hàm lấy thông tin người dùng từ token trong cookie hoặc header Authorization
 * Trong môi trường thực tế, cần xác thực JWT token
 */
export async function getUserFromRequest(request: Request | NextRequest): Promise<UserData | null> {
  try {
    // Lấy token từ header Authorization
    let token = request.headers.get('authorization')?.split(' ')[1];
    
    // Nếu không có token trong header, thử lấy từ cookie
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get('token')?.value;
      } catch (error) {
        console.error('Error accessing cookies:', error);
      }
    }
    
    if (!token) {
      return null;
    }
    
    // Xác thực token
    const user = await verifyToken(token);
    if (user) {
      return user;
    }
    
    return null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

async function verifyToken(token: string): Promise<UserData | null> {
  // Thực hiện logic verify token
  // Truy vấn thông tin user từ database
  // ...
  // Giả sử có user
  return {
    id: 'admin_id',
    username: 'admin',
    role: 'admin',
    fullName: 'Admin User',
    balance: {
      available: 0,
      frozen: 0
    }
  };
}
