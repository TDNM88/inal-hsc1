import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

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

const JWT_SECRET = process.env.JWT_SECRET || 'inalhsc-secret-key';
const SALT_ROUNDS = 10;

/**
 * Mã hóa mật khẩu sử dụng bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Lỗi khi mã hóa mật khẩu');
  }
}

/**
 * So sánh mật khẩu với mật khẩu đã mã hóa
 */
export async function comparePassword(plainPassword: string, hashedPassword: string | null | undefined): Promise<boolean> {
  if (!hashedPassword) return false;
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

/**
 * Tạo JWT token
 */
export async function generateToken(payload: any): Promise<string> {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Lỗi khi tạo token');
  }
}

/**
 * Xác thực JWT token và trả về thông tin người dùng
 */
export async function verifyToken(token: string): Promise<UserData | null> {
  try {
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true') {
      // Chỉ sử dụng trong môi trường phát triển với biến môi trường USE_MOCK_AUTH
      console.log('Using mock authentication in development');
      return {
        id: token.includes('admin') ? 'admin_id' : 'user_id',
        username: token.includes('admin') ? 'admin' : 'user',
        role: token.includes('admin') ? 'admin' : 'user',
        fullName: token.includes('admin') ? 'Admin User' : 'Normal User',
        balance: {
          available: 1000000,
          frozen: 0
        }
      };
    }
    
    // Xác thực token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, username: string, role: 'admin' | 'user' };
    if (!decoded || !decoded.id) {
      return null;
    }
    
    // Lấy thông tin người dùng từ cơ sở dữ liệu
    const db = await getMongoDb();
    if (!db) {
      console.error('Không thể kết nối đến cơ sở dữ liệu');
      return null;
    }
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
    
    if (!user) {
      return null;
    }
    
    return {
      id: user._id.toString(),
      username: user.username,
      role: user.role as 'admin' | 'user',
      fullName: user.fullName || '',
      balance: user.balance || { available: 0, frozen: 0 }
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}
