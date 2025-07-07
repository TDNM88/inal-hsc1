// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { Customer } from '@/lib/useCustomers'; // Import the Customer interface

export async function POST(request: Request) {
  try {
    // Parse request body
    const { username, password, email, fullName, phone, bank } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ thông tin: username và password' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Validate email format (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const db = await getMongoDb();
    if (!db) {
      throw new Error('Không thể kết nối đến cơ sở dữ liệu');
    }

    // Check if username or email already exists
    const existingUser = await db.collection('users').findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Tên đăng nhập hoặc email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user aligned with Customer interface
    const now = new Date().toISOString();
    const newUser: Omit<Customer, '_id'> & { password: string } = {
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      fullName,
      phone,
      balance: {
        available: 0,
        frozen: 0,
      },
      status: 'active',
      role: 'customer',
      createdAt: now,
      updatedAt: now,
      lastLoginIp: request.headers.get('x-forwarded-for') || '',
      verification: {
        status: 'pending',
        cccdFront: '',
        cccdBack: '',
      },
      bank: bank || {
        name: '',
        accountNumber: '',
        accountHolder: '',
      },
      password: hashedPassword,
    };

    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);

    if (!result.insertedId) {
      throw new Error('Không thể tạo tài khoản');
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json({
      success: true,
      message: 'Đăng ký thành công!',
      user: { ...userWithoutPassword, _id: result.insertedId.toString() },
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Lỗi hệ thống khi đăng ký';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
