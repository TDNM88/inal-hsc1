import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, isAdmin } = body;
    
    // Get the referer to determine if it's an admin login
    const referer = request.headers.get('referer') || '';
    const isAdminLogin = isAdmin || referer.includes('/login');
    
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
    
    // Check if user is trying to access admin but doesn't have admin role
    if (isAdminLogin && (!user.role || user.role !== 'admin')) {
      return NextResponse.json(
        { message: 'Bạn không có quyền truy cập trang quản trị' },
        { status: 403 }
      );
    }

    // Create authentication token
    const token = await generateToken({
      id: user._id.toString(),
      username: user.username,
      role: user.role || 'user',
      isAdmin: user.role === 'admin'
    });
    
    // Prepare user data to return
    const userData = {
      id: user._id.toString(),
      username: user.username,
      role: user.role || 'user',
      isAdmin: user.role === 'admin',
      fullName: user.fullName || '',
      balance: user.balance || { available: 0, frozen: 0 },
      bank: user.bank || null
    };
    
    // Get the URL from the request
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get('callbackUrl');
    
    // Xác định trang đích dựa trên vai trò
    let redirectTo = '/trade'; // Mặc định là trang trade
    
    if (user.role === 'admin') {
      redirectTo = '/dashboard-hsc';
    } else if (callbackUrl) {
      // Chỉ sử dụng callbackUrl nếu không phải admin
      redirectTo = callbackUrl;
    }
    
    // Create response with user data and token
    const response = NextResponse.json({
      success: true,
      user: userData,
      token: token, // Include the token in the response
      redirectTo: redirectTo
    });
    
    // Set HTTP-only cookie on the response
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Thay đổi từ 'strict' sang 'lax' để đảm bảo hoạt động tốt hơn
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    // Thêm header Cache-Control
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Lỗi đăng nhập', 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
