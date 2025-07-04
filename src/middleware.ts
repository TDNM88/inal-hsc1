import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Hàm xác thực token JWT tương thích với Edge Runtime
async function verifyJWTToken(token: string) {
  try {
    // Sử dụng jose thay vì jsonwebtoken để tương thích với Edge
    const JWT_SECRET = new TextEncoder().encode(
      process.env.JWT_SECRET || 'inalhsc-secret-key'
    );
    
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    return {
      id: payload.id as string,
      username: payload.username as string,
      role: payload.role as string
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Chặn truy cập trực tiếp đến trang admin
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    // Điều hướng về trang chính 
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rewrite /dashboard-hsc đến /admin mà không kiểm tra token ở middleware
  // Xác thực sẽ được xử lý tại trang admin client-side
  if (request.nextUrl.pathname.startsWith('/dashboard-hsc')) {
    // Làm rewrite URL trực tiếp đến route admin thực tế
    const newPath = request.nextUrl.pathname.replace('/dashboard-hsc', '/admin');
    
    // Tạo URL mới với đường dẫn đã thay đổi
    const url = new URL(newPath, request.url);
    // Sao chép tất cả params từ URL gốc
    url.search = request.nextUrl.search;
    
    return NextResponse.rewrite(url);
  }

  // Các URL khác được truy cập bình thường
  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các đường dẫn cần kiểm tra
export const config = {
  matcher: ['/admin', '/admin/:path*', '/dashboard-hsc', '/dashboard-hsc/:path*'],
};
