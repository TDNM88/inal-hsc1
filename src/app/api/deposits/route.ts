import { NextRequest, NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';
import { uploadFile } from '@/lib/fileUpload';

// API để tạo yêu cầu nạp tiền mới
export async function POST(req: NextRequest) {
  try {
    // Xác thực người dùng
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ message: 'Bạn cần đăng nhập' }, { status: 401 });
    }

    const authResult = await verifyToken(token);
    if (!authResult.isValid || !authResult.userId) {
      return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 401 });
    }

    // Kiểm tra xem yêu cầu có phải là JSON không
    let amount: number;
    let billUrl: string | null = null;
    
    // Kiểm tra content-type để xác định cách xử lý dữ liệu
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Xử lý form data (file upload)
      const formData = await req.formData();
      const amountValue = formData.get('amount');
      const bill = formData.get('bill') as File | null;
      
      if (!amountValue || !bill) {
        return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
      }
      
      amount = Number(amountValue);
      
      // Upload bill nếu có
      try {
        const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/upload`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.message || 'Lỗi khi tải lên ảnh xác nhận');
        }
        
        const uploadResult = await uploadResponse.json();
        billUrl = uploadResult.url;
      } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ 
          message: 'Lỗi khi tải lên ảnh xác nhận',
          error: (error as Error).message 
        }, { status: 500 });
      }
    } else if (contentType.includes('application/json')) {
      // Xử lý JSON data
      const data = await req.json();
      amount = Number(data.amount);
      billUrl = data.billUrl || null;
      
      if (!amount || !billUrl) {
        return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
      }
    } else {
      return NextResponse.json({ message: 'Định dạng yêu cầu không được hỗ trợ' }, { status: 400 });
    }

    if (!amount || !billUrl) {
      return NextResponse.json({ message: 'Thiếu thông tin cần thiết' }, { status: 400 });
    }

    // Kết nối DB
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ message: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 });
    }

    // Lấy thông tin người dùng
    const userData = await db.collection('users').findOne({ _id: new ObjectId(authResult.userId) });
    if (!userData) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    // Lấy cài đặt hệ thống để kiểm tra giới hạn nạp tiền
    const settings = await db.collection('settings').findOne({});
    if (settings && amount < settings.depositLimits.min) {
      return NextResponse.json({ 
        message: `Số tiền nạp tối thiểu là ${settings.depositLimits.min.toLocaleString()} đ` 
      }, { status: 400 });
    }

    if (settings && amount > settings.depositLimits.max) {
      return NextResponse.json({ 
        message: `Số tiền nạp tối đa là ${settings.depositLimits.max.toLocaleString()} đ` 
      }, { status: 400 });
    }

    // Tạo yêu cầu nạp tiền mới
    const deposit = {
      user: new ObjectId(authResult.userId),
      amount,
      status: 'pending',
      proofImage: billUrl,
      bankInfo: settings?.bankDetails?.[0] || {},
      userInfo: {
        username: userData.username,
        email: userData.email,
        phone: userData.phone
      },
      note: '',
      processedBy: null,
      processedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('deposits').insertOne(deposit);

    // Gửi thông báo cho admin
    try {
      // TODO: Gửi thông báo cho admin qua socket hoặc email
      console.log(`Đã tạo yêu cầu nạp tiền mới: ${result.insertedId}`);
      
      // Có thể thêm gọi webhook hoặc service thông báo ở đây
      if (process.env.ADMIN_WEBHOOK_URL) {
        await fetch(process.env.ADMIN_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_DEPOSIT_REQUEST',
            depositId: result.insertedId,
            amount: amount,
            userId: authResult.userId,
            username: userData.username,
            timestamp: new Date().toISOString()
          })
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Lỗi khi gửi thông báo:', error);
      // Tiếp tục xử lý ngay cả khi gửi thông báo thất bại
    }

    return NextResponse.json({
      message: 'Yêu cầu nạp tiền đã được gửi',
      depositId: result.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating deposit request:', error);
    return NextResponse.json({ message: 'Đã xảy ra lỗi khi tạo yêu cầu nạp tiền' }, { status: 500 });
  }
}
