import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthSession } from '@/lib/simple-auth';

// Protected routes
const protectedRoutes = ['/trade', '/account', '/deposit', '/withdraw', '/orders'];
const adminRoutes = ['/dashboard-hsc', '/admin'];
const authRoutes = ['/login', '/register'];
const publicRoutes = ['/'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Bỏ qua các route API và file tĩnh
  if (pathname.startsWith('/api/') || 
      pathname.match(/\.(.*)$/) || 
      pathname.startsWith('/_next/') || 
      pathname === '/favicon.ico' ||
      pathname.includes('.')) { // Bỏ qua tất cả các file có đuôi
    return NextResponse.next();
  }

  const session = await getAuthSession();
  const user = session?.user || null;
  const isAdmin = session?.isAdmin || false;
  
  // Log để debug
  console.log('Middleware - Path:', pathname, 'User:', user ? 'Logged in' : 'Not logged in');
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === '';
  
  // Nếu đang ở trang đăng nhập/đăng ký và đã đăng nhập
  if (user && isAuthRoute) {
    // Admin sẽ được chuyển đến dashboard
    if (isAdmin) {
      return NextResponse.redirect(new URL('/dashboard-hsc', request.url));
    }
    // Người dùng thường sẽ được chuyển đến trang trade
    return NextResponse.redirect(new URL('/trade', request.url));
  }
  
  // Nếu chưa đăng nhập và truy cập vào trang cần xác thực
  if (!user && (isProtectedRoute || isAdminRoute)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Người dùng thường không thể truy cập trang admin
  if (user && isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL('/trade', request.url));
  }

  // Tiếp tục xử lý request nếu không có chuyển hướng nào được thực hiện
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|api/auth/).*)',
  ],
};
