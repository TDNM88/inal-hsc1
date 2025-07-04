import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Mock successful registration
    // Thông thường sẽ có validation, kiểm tra user đã tồn tại, lưu vào DB, etc.
    
    return NextResponse.json(
      { message: 'Đăng ký thành công' },
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
