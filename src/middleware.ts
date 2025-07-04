import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Chặn truy cập trực tiếp đến trang admin
  if (request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')) {
    // Điều hướng về trang chính
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rewrite /dashboard-hsc đến /admin
  if (request.nextUrl.pathname.startsWith('/dashboard-hsc')) {
    // Làm rewrite URL đến route admin thực tế
    const newPath = request.nextUrl.pathname.replace('/dashboard-hsc', '/admin');
    
    // Tạo URL mới
    const url = new URL(newPath, request.url);
    url.search = request.nextUrl.search;
    
    return NextResponse.rewrite(url);
  }

  // Các URL khác được truy cập bình thường
  return NextResponse.next();
}

// Chỉ áp dụng middleware cho các đường dẫn cụ thể
// Đơn giản hóa để tránh xung đột với các route khác
export const config = {
  matcher: [
    '/admin', 
    '/admin/:path*', 
    '/dashboard-hsc', 
    '/dashboard-hsc/:path*'
  ]
};
