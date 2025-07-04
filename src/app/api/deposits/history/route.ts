import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

// API để lấy lịch sử nạp tiền của người dùng
export async function GET(req: NextRequest) {
  try {
    // Xác thực người dùng
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 401 });
    }

    // Parse query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Kết nối DB
    const db = await getMongoDb();

    // Lấy danh sách nạp tiền của người dùng
    const deposits = await db.collection('deposits')
      .find({ user: new ObjectId(user.id) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Lấy tổng số bản ghi để phân trang
    const total = await db.collection('deposits')
      .countDocuments({ user: new ObjectId(user.id) });

    return NextResponse.json({
      deposits,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching deposit history:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi khi lấy lịch sử nạp tiền' }, { status: 500 });
  }
}
