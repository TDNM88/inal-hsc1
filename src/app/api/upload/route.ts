import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/fileUpload';
import { getMongoDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

// Cấu hình cho API route này để cho phép file lớn
export const config = {
  api: {
    bodyParser: false, // Disable body parser để xử lý upload file lớn
  },
  maxDuration: 60, // Tăng thời gian tối đa của serverless function (cho Vercel)
};

// API xử lý upload file
export async function POST(req: NextRequest) {
  try {
    

    // Xử lý form data
    const formData = await req.formData();
    let file = formData.get('file') as File;
    
    // Nếu không có file từ trường 'file', thử lấy từ trường 'document' (tương thích ngược)
    if (!file) {
      const altFile = formData.get('document') as File;
      if (altFile) {
        file = altFile;
      }
    }
    
    // Nếu vẫn không có file, trả về lỗi
    if (!file) {
      return NextResponse.json({ message: 'Không tìm thấy file' }, { status: 400 });
    }
    
    // Mặc định type là 'bill' nếu không có
    const type = (formData.get('type') as string) || 'bill';

    if (!file) {
      return NextResponse.json({ message: 'Không tìm thấy file' }, { status: 400 });
    }

    // Xác thực loại tài liệu
    if (!['front', 'back'].includes(type)) {
      return NextResponse.json({ message: 'Loại tài liệu không hợp lệ' }, { status: 400 });
    }

    // Kiểm tra loại file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'Chỉ chấp nhận file ảnh' }, { status: 400 });
    }

    // Kiểm tra kích thước file (giới hạn 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Kích thước file không được vượt quá 5MB' }, { status: 400 });
    }

    try {
      // Upload file lên Vercel Blob
      const fileUrl = await uploadFile(file);

      // Lấy kết nối MongoDB
      const db = await getMongoDb();
      if (!db) {
        throw new Error('Không thể kết nối đến cơ sở dữ liệu');
      }

      // Cập nhật thông tin xác minh
      const userIdObj = new ObjectId(authResult.userId);
      const updateData: any = {
        $set: {
          [`verification.${type === 'front' ? 'cccdFront' : 'cccdBack'}`]: fileUrl,
          'verification.verified': false,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      };
      
      // Cập nhật hoặc tạo mới thông tin xác minh
      const result = await db.collection('users').updateOne(
        { _id: userIdObj },
        updateData,
        { upsert: true }
      );

      if (!result.acknowledged) {
        throw new Error('Không thể cập nhật thông tin người dùng');
      }

      // Lấy thông tin cập nhật để kiểm tra
      const updatedUser = await db.collection('users').findOne(
        { _id: userIdObj },
        { projection: { 'verification.cccdFront': 1, 'verification.cccdBack': 1 } }
      );

      // Kiểm tra nếu đã tải lên đủ 2 mặt
      if (updatedUser?.verification?.cccdFront && updatedUser?.verification?.cccdBack) {
        console.log(`Người dùng ${authResult.userId} đã tải lên đủ 2 mặt CCCD`);
      }
      
      // Trả về đường dẫn file
      return NextResponse.json({
        success: true,
        message: `Đã tải lên ${type === 'front' ? 'mặt trước' : 'mặt sau'} thành công`,
        url: fileUrl,
        type: type
      }, { status: 200 });
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      message: 'Đã xảy ra lỗi khi upload file',
      error: (error as Error).message 
    }, { status: 500 });
  }
}
