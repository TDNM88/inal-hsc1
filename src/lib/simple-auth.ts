import { getMongoDb } from './db';
import { comparePassword } from './auth';

type User = {
  _id: string;
  username: string;
  password: string;
  role: string;
  email?: string;
};

export async function authenticateUser(username: string, password: string): Promise<{ success: boolean; user?: Omit<User, 'password'>; error?: string }> {
  try {
    const db = await getMongoDb();
    if (!db) {
      return { success: false, error: 'Không thể kết nối cơ sở dữ liệu' };
    }

    const user = await db.collection('users').findOne<User>({ username });
    if (!user) {
      return { success: false, error: 'Tên đăng nhập không tồn tại' };
    }

    const isPasswordValid = await comparePassword(password, user.password || '');
    if (!isPasswordValid) {
      return { success: false, error: 'Mật khẩu không chính xác' };
    }

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user;
    return { 
      success: true, 
      user: {
        ...userWithoutPassword,
        _id: user._id.toString(),
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Đã xảy ra lỗi khi xác thực' };
  }
}

export function setAuthSession(user: Omit<User, 'password'>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authUser', JSON.stringify(user));
  }
}

export function getAuthSession() {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('authUser');
  return user ? JSON.parse(user) : null;
}

export function clearAuthSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authUser');
  }
}
