import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { comparePassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tên đăng nhập và mật khẩu' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu' },
        { status: 500 }
      );
    }

    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Tên đăng nhập không tồn tại' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.password || '');
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      success: true,
      user: {
        ...userWithoutPassword,
        _id: user._id.toString(),
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Đã xảy ra lỗi khi đăng nhập' },
      { status: 500 }
    );
  }
}
