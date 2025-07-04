import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  // Chặn truy cập trực tiếp đến trang admin
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    // Điều hướng về trang chính 
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Cho phép truy cập qua đường dẫn ẩn (dashboard-hsc)
  if (request.nextUrl.pathname.startsWith('/dashboard-hsc')) {
    // Kiểm tra token xác thực từ cookie hoặc header
    const token = request.cookies.get('token')?.value 
      || request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      // Không có token, điều hướng về trang login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      // Xác thực token và kiểm tra quyền admin
      const user = await verifyToken(token);
      
      if (!user || user.role !== 'admin') {
        // Không phải admin, điều hướng về trang chủ
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Là admin, cho phép truy cập và rewrite URL nội bộ đến route admin thực tế
      const newPath = request.nextUrl.pathname.replace('/dashboard-hsc', '/admin');
      
      // Tạo URL mới với đường dẫn đã thay đổi
      const url = new URL(newPath, request.url);
      // Sao chép tất cả params từ URL gốc
      url.search = request.nextUrl.search;
      
      return NextResponse.rewrite(url);
    } catch (error) {
      console.error('Admin access error:', error);
      // Token không hợp lệ, điều hướng về login
      return NextResponse.redirect(new URL('/login?error=auth', request.url));
    }
  }

  // Các URL khác được truy cập bình thường
  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các đường dẫn cần kiểm tra
export const config = {
  matcher: ['/admin', '/admin/:path*', '/dashboard-hsc', '/dashboard-hsc/:path*'],
};
