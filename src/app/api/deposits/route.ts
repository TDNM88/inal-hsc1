import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    const authResult = await verifyToken(token);
    if (!authResult.isValid || !authResult.userId) {
      return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 401 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ message: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 });
    }

    // Lấy cài đặt hệ thống
    let settings = await db.collection('settings').findOne({});
    
    // Nếu chưa có cài đặt, tạo cài đặt mặc định
    if (!settings) {
      const defaultSettings = {
        bankDetails: [{
          bankName: 'ABBANK',
          accountNumber: '0387473721',
          accountName: 'VU VAN MIEN'
        }],
        minDeposit: 50000,
        maxDeposit: 10000000,
        minWithdraw: 100000,
        maxWithdraw: 50000000,
        minTrade: 10000,
        maxTrade: 1000000,
        payoutRate: 1.8,
        maintenanceMode: false,
        cskhLink: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('settings').insertOne(defaultSettings);
      settings = defaultSettings;
    }

    return NextResponse.json(settings, { status: 200 });

  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      message: 'Đã xảy ra lỗi khi lấy cài đặt hệ thống' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    const authResult = await verifyToken(token);
    if (!authResult.isValid || !authResult.userId) {
      return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 401 });
    }

    // Kiểm tra quyền admin
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ message: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 });
    }

    const user = await db.collection('users').findOne({ _id: authResult.userId });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ message: 'Không có quyền truy cập' }, { status: 403 });
    }

    const updateData = await req.json();
    updateData.updatedAt = new Date();

    const result = await db.collection('settings').updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    );

    return NextResponse.json({ 
      message: 'Cập nhật cài đặt thành công',
      result 
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ 
      message: 'Đã xảy ra lỗi khi cập nhật cài đặt' 
    }, { status: 500 });
  }
}
