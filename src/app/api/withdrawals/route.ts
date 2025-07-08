import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

// API để tạo yêu cầu rút tiền mới
export async function POST(req: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Không tìm thấy token hoặc định dạng không hợp lệ' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Token không được cung cấp' }, { status: 401 });
    }

    // Verify token
    let userFromToken;
    try {
      userFromToken = await verifyToken(token);
      if (!userFromToken || !userFromToken.id) {
        return NextResponse.json({ message: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 401 });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ message: 'Lỗi xác thực token' }, { status: 401 });
    }

    // Parse request body
    const { amount, bankName, accountNumber } = await req.json();

    if (!amount || !bankName || !accountNumber) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết (số tiền, tên ngân hàng, số tài khoản)' }, { status: 400 });
    }

    // Validate amount is a number
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ message: 'Số tiền không hợp lệ' }, { status: 400 });
    }

    // Kết nối DB
    const db = await getMongoDb();

    // Lấy thông tin người dùng
    const user = await db.collection('users').findOne({ _id: new ObjectId(userFromToken.id) });
    if (!user) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Lấy cài đặt hệ thống để kiểm tra giới hạn rút tiền
    const settings = await db.collection('settings').findOne({});
    if (settings && parsedAmount < settings.withdrawalLimits?.min) {
      return NextResponse.json({ 
        message: `Số tiền rút tối thiểu là ${settings.withdrawalLimits.min.toLocaleString()} đ` 
      }, { status: 400 });
    }

    if (settings && parsedAmount > settings.withdrawalLimits?.max) {
      return NextResponse.json({ 
        message: `Số tiền rút tối đa là ${settings.withdrawalLimits.max.toLocaleString()} đ` 
      }, { status: 400 });
    }

    // Kiểm tra số dư
    if (user.balance < parsedAmount) {
      return NextResponse.json({ message: 'Số dư không đủ' }, { status: 400 });
    }

    // Tạo yêu cầu rút tiền mới
    const withdrawal = {
      user: new ObjectId(userFromToken.id),
      amount: parsedAmount,
      bank: {
        bankName,
        accountNumber,
      },
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('withdrawals').insertOne(withdrawal);

    // Tạm thời giảm số dư người dùng (sẽ hoàn lại nếu yêu cầu bị từ chối)
    await db.collection('users').updateOne(
      { _id: new ObjectId(userFromToken.id) },
      { $inc: { balance: -parsedAmount } }
    );

    // Gửi thông báo cho admin (có thể triển khai sau)
    // TODO: Gửi thông báo cho admin qua socket hoặc email

    return NextResponse.json({
      message: 'Yêu cầu rút tiền đã được gửi',
      withdrawalId: result.insertedId,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi khi tạo yêu cầu rút tiền' }, { status: 500 });
  }
}
