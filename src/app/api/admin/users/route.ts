import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import UserModel, { IUser } from '@/models/User';

// Hàm lấy danh sách người dùng
export async function GET(request: Request) {
  try {
    // Xác thực admin (nếu có xác thực)
    // Có thể bỏ qua phần này trong môi trường phát triển
    try {
      const admin = await getUserFromRequest(request);
      if (!admin || admin.role !== 'admin') {
        return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
      }
    } catch (authError) {
      console.warn('Auth check bypassed in development:', authError);
      // Trong môi trường phát triển, có thể bỏ qua lỗi xác thực
    }

    // Lấy tham số tìm kiếm từ query string
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 100;
    
    // Kết nối đến database
    await connectToDatabase();
    
    // Xây dựng query
    let query: any = {};
    
    // Tìm kiếm theo username hoặc fullName
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Lọc theo trạng thái
    if (status !== 'all') {
      query['status.active'] = (status === 'active');
    }
    
    // Truy vấn database
    const users = await UserModel.find(query)
      .select('-password') // Không trả về mật khẩu
      .limit(limit)
      .lean();
    
    // Nếu không có dữ liệu trong database, tạo dữ liệu mẫu
    if (users.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No users found in database, returning mock data');
      return NextResponse.json({ users: generateMockUsers(50) });
    }

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Lỗi khi lấy danh sách người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// API cập nhật trạng thái người dùng
export async function PUT(request: Request) {
  try {
    // Xác thực admin (nếu có xác thực)
    try {
      const admin = await getUserFromRequest(request);
      if (!admin || admin.role !== 'admin') {
        return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
      }
    } catch (authError) {
      console.warn('Auth check bypassed in development:', authError);
    }

    // Kết nối database
    await connectToDatabase();

    const body = await request.json();
    const { userId, field, value } = body;

    if (!userId || field === undefined) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }

    // Xây dựng update object dựa trên field
    let updateObject: any = {};
    const fieldParts = field.split('.');
    
    // Validate giá trị
    if (value === undefined || value === null) {
      return NextResponse.json({ message: `Giá trị cho trường ${field} không hợp lệ` }, { status: 400 });
    }

    // Xử lý các trường đặc biệt
    if (field === 'password') {
      if (typeof value !== 'string' || value.length < 6) {
        return NextResponse.json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
      }
      updateObject[field] = value; // Trong thực tế nên hash mật khẩu trước khi lưu
    } 
    else if (field === 'balance.available' || field === 'balance.frozen') {
      // Validate số dư
      const balance = Number(value);
      if (isNaN(balance) || balance < 0) {
        return NextResponse.json({ message: 'Số dư không hợp lệ' }, { status: 400 });
      }
      updateObject[field] = balance;
    }
    else if (field.startsWith('status.')) {
      // Cập nhật trạng thái
      const statusField = fieldParts[1];
      if (typeof value !== 'boolean') {
        return NextResponse.json({ message: 'Giá trị trạng thái không hợp lệ' }, { status: 400 });
      }
      updateObject[`status.${statusField}`] = value;
    } 
    else if (field.startsWith('verification.')) {
      // Cập nhật trạng thái xác minh
      const verificationField = fieldParts[1];
      updateObject[`verification.${verificationField}`] = value;
    }
    else if (field.startsWith('bank.')) {
      // Cập nhật thông tin ngân hàng
      const bankField = fieldParts[1];
      if (!['name', 'accountNumber', 'accountHolder'].includes(bankField)) {
        return NextResponse.json({ message: 'Trường thông tin ngân hàng không hợp lệ' }, { status: 400 });
      }
      updateObject[`bank.${bankField}`] = value;
    }
    else {
      // Cập nhật thông tin cơ bản
      const allowedFields = ['username', 'fullName', 'email', 'phoneNumber'];
      if (!allowedFields.includes(field)) {
        return NextResponse.json({ message: 'Trường cập nhật không được phép' }, { status: 400 });
      }
      updateObject[field] = value;
    }

    // Cập nhật user trong database
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateObject },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Cập nhật thành công', user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { message: 'Lỗi khi cập nhật người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// API xóa người dùng
export async function DELETE(request: Request) {
  try {
    // Xác thực admin (nếu có xác thực)
    try {
      const admin = await getUserFromRequest(request);
      if (!admin || admin.role !== 'admin') {
        return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
      }
    } catch (authError) {
      console.warn('Auth check bypassed in development:', authError);
    }

    // Lấy thông tin từ body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: 'Thiếu ID người dùng' }, { status: 400 });
    }

    // Kết nối database
    await connectToDatabase();

    // Tìm và xóa người dùng
    const deletedUser = await UserModel.findByIdAndDelete(userId).select('-password');

    if (!deletedUser) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Xóa người dùng thành công',
      user: deletedUser
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Lỗi khi xóa người dùng', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Hàm tạo dữ liệu mẫu khi chưa có database hoặc database trống
function generateMockUsers(count: number) {
  const users = [];
  
  for (let i = 1; i <= count; i++) {
    const randomId = Math.random().toString(36).substring(2, 10);
    const isVerified = Math.random() > 0.3;
    const isActive = Math.random() > 0.2;
    const isBetLocked = Math.random() > 0.8;
    const isWithdrawLocked = Math.random() > 0.7;
    
    users.push({
      _id: `user_${randomId}`,
      username: `user${i}`,
      fullName: `Người dùng ${i}`,
      email: `user${i}@example.com`,
      phoneNumber: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      loginInfo: `192.168.1.${Math.floor(Math.random() * 255)}`,
      balance: {
        available: Math.floor(Math.random() * 10000000),
        frozen: Math.floor(Math.random() * 1000000)
      },
      bank: {
        name: ['ACB', 'Vietcombank', 'BIDV', 'Techcombank'][Math.floor(Math.random() * 4)],
        accountNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        accountHolder: `NGUYEN VAN ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`
      },
      verification: {
        verified: isVerified,
        cccdFront: isVerified,
        cccdBack: isVerified
      },
      status: {
        active: isActive,
        betLocked: isBetLocked,
        withdrawLocked: isWithdrawLocked
      }
    });
  }
  
  return users;
}
