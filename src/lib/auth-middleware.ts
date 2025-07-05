import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthSession } from './simple-auth';

// Danh sách các route yêu cầu đăng nhập
const protectedRoutes = ['/dashboard', '/admin'];
const publicRoutes = ['/login', '/register', '/forgot-password'];

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = getAuthSession();

  // Nếu người dùng đã đăng nhập và cố gắng truy cập trang đăng nhập/đăng ký
  if (user && publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Nếu người dùng chưa đăng nhập và cố gắng truy cập trang được bảo vệ
  if (!user && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL(
      `/login?callbackUrl=${encodeURIComponent(pathname)}`,
      request.url
    ));
  }

  return NextResponse.next();
}
