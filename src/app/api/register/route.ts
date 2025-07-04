import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, fullName, phone } = body;
    
    if (!username || !password) {
      return NextResponse.json({ message: 'Tên đăng nhập và mật khẩu là bắt buộc' }, { status: 400 });
    }
    
    // Kiểm tra độ dài và độ phức tạp của mật khẩu
    if (password.length < 6) {
      return NextResponse.json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }
    
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ message: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 });
    }
    
    // Kiểm tra tên đăng nhập đã tồn tại chưa
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return NextResponse.json({ message: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await hashPassword(password);
    
    // Tạo người dùng mới
    const newUser = {
      username,
      password: hashedPassword,
      fullName: fullName || '',
      phone: phone || '',
      role: 'user',
      balance: { available: 0, frozen: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Lưu người dùng vào cơ sở dữ liệu
    const result = await db.collection('users').insertOne(newUser);
    
    if (!result.insertedId) {
      throw new Error('Lỗi khi tạo người dùng');
    }
    
    return NextResponse.json(
      { message: 'Đăng ký thành công', userId: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Lỗi đăng ký', error: (error as Error).message },
      { status: 500 }
    );
  }
}
