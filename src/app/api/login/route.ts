import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;
    
    // Giả lập kiểm tra credentials
    // Không thực sự kiểm tra mật khẩu ở đây vì đây là API mock
    
    // Giả lập admin nếu username có chứa 'admin'
    const role = username.toLowerCase().includes('admin') ? 'admin' : 'user';
    
    return NextResponse.json({
      token: 'mock_jwt_token_' + Math.random().toString(36).substring(2),
      user: {
        id: 'mock_id_' + Math.random().toString(36).substring(2),
        username,
        role,
        fullName: username.charAt(0).toUpperCase() + username.slice(1),
        balance: {
          available: 1000000,
          frozen: 0
        },
        bank: {
          bankName: 'ACB',
          accountNumber: '12345678',
          accountName: username.toUpperCase() + ' MOCK ACCOUNT'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Lỗi đăng nhập', error: (error as Error).message },
      { status: 500 }
    );
  }
}
