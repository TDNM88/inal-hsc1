import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    if (!username || !password) {
      return NextResponse.json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' }, { status: 400 });
    }
    
    // Kết nối với cơ sở dữ liệu
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ message: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 });
    }
    
    // Tìm kiếm người dùng trong cơ sở dữ liệu
    const user = await db.collection('users').findOne({ username });
    
    // Kiểm tra nếu người dùng không tồn tại
    if (!user) {
      return NextResponse.json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, { status: 401 });
    }
    
    // Kiểm tra mật khẩu
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, { status: 401 });
    }
    
    // Tạo token xác thực
    const token = await generateToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role
    });
    
    // Chuẩn bị thông tin người dùng để trả về
    const userData = {
      id: user._id.toString(),
      username: user.username,
      role: user.role || 'user',
      fullName: user.fullName || '',
      balance: user.balance || { available: 0, frozen: 0 },
      bank: user.bank || null
    };
    
    return NextResponse.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Lỗi đăng nhập', error: (error as Error).message },
      { status: 500 }
    );
  }
}
