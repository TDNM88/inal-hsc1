import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Danh sách domain được phép truy cập
const allowedOrigins = [
  'https://inal-hsc1.com',
  'https://www.inal-hsc1.com',
  'https://london-hsc.com',
  'https://www.london-hsc.com',
  // Môi trường phát triển
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Các header bảo mật
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

// Hàm thiết lập CORS headers
function setCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 giờ
  response.headers.set('Vary', 'Origin');
  return response;
}

// Hàm lấy token từ request
function getTokenFromRequest(request: NextRequest): { token: string | null; source: string } {
  console.log('Getting token from request...');
  
  // 1. Ưu tiên lấy từ header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log('Got token from Authorization header');
    return { token, source: 'header' };
  }
  
  // 2. Thử lấy từ cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    const token = cookies['token'];
    if (token) {
      console.log('Got token from cookie');
      return { token, source: 'cookie' };
    }
  }
  
  // 3. Thử lấy từ URL (cho trường hợp redirect từ OAuth hoặc email)
  const url = new URL(request.url);
  const tokenFromUrl = url.searchParams.get('token');
  if (tokenFromUrl) {
    console.log('Got token from URL');
    return { token: tokenFromUrl, source: 'url' };
  }
  
  console.log('No token found in request');
  return { token: null, source: 'none' };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin') || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));

  // Xử lý preflight request
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, origin);
  }

  // Tạo response mới với CORS headers nếu cần
  let response: NextResponse;
  
  if (isAllowedOrigin) {
    const newResponse = NextResponse.next();
    setCorsHeaders(newResponse, origin);
    response = newResponse;
  } else {
    response = NextResponse.next();
  }

  // Bỏ qua xác thực cho các route công khai
  const publicPaths = ['/api/auth', '/_next', '/favicon.ico'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return response;
  }

  // Bỏ qua xác thực cho các route cụ thể
  const authWhitelist = [
    '/api/auth',
    '/_next',
    '/favicon.ico',
    '/api/health'
  ];
  
  const shouldSkipAuth = authWhitelist.some(path => 
    pathname.startsWith(path)
  );
  
  if (shouldSkipAuth) {
    return response;
  }
  
  // Lấy token từ request
  const { token, source } = getTokenFromRequest(request);
  console.log(`Token in middleware: ${token ? `Found in ${source}` : 'Not found'}`);
  
  // Kiểm tra token
  if (!token) {
    console.log('No token found in request');
    
    // Nếu là API request, trả về lỗi 401 thay vì redirect
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Redirect về trang đăng nhập cho các request thông thường
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  try {
    // Kiểm tra token hợp lệ
    const { isValid, userId } = await verifyToken(token);
    
    if (!isValid || !userId) {
      console.log('Invalid or expired token');
      
      // Xóa cookie token nếu không hợp lệ
      response.cookies.delete('token');
      
      // Nếu là API request, trả về lỗi 401
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Redirect về trang đăng nhập cho các request thông thường
      return NextResponse.redirect(new URL('/login', request.url), {
        headers: response.headers
      });
    }
    
    // Thêm thông tin user vào headers cho các API request
    if (pathname.startsWith('/api/')) {
      request.headers.set('x-user-id', userId);
    }
    
  } catch (error) {
    console.error('Error verifying token:', error);
    
    // Nếu có lỗi khi xác thực token, trả về lỗi 500
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Lỗi khi xác thực' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Xử lý preflight request (OPTIONS)
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return setCorsHeaders(response, origin);
  }

  // Chặn request từ origin không được phép
  if (origin && !isAllowedOrigin) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        message: 'Not allowed by CORS',
        allowedOrigins
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  
  // API routes that don't require authentication
  const publicApiRoutes = ["/api/auth/me"];
  
  // Skip auth check for public API routes
  if (publicApiRoutes.some(route => pathname.startsWith(route))) {
    return response;
  }

  // API routes that should be handled separately
  if (pathname.startsWith("/api/")) {
    // Chặn request từ origin không được phép
    if (origin && !isAllowedOrigin) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          message: 'Not allowed by CORS',
          allowedOrigins
        }),
        {
          status: 403,
          headers: { 
            'Content-Type': 'application/json',
            ...Object.fromEntries(
              Object.entries(securityHeaders).map(([k, v]) => [k, v])
            )
          }
        }
      );
    }

    // Thêm các header bảo mật cho API
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Thêm CORS headers cho các response API
    if (isAllowedOrigin) {
      response = setCorsHeaders(response, origin);
    }
    
    return response;
  }

  // Static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/site.webmanifest" ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  ) {
    return response;
  }

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Nếu không có token, chuyển hướng về trang đăng nhập
  if (!token) {
    console.log('No token found, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    
    // Nếu là API request, trả về lỗi 401 thay vì redirect
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return NextResponse.redirect(loginUrl);
  }

  // If has token but trying to access auth pages, redirect to home
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Thêm các header bảo mật cho các trang thông thường
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Log các request (chỉ trong môi trường development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${request.method}] ${pathname}`, {
      origin,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site.webmanifest (web app manifest)
     * - images/ (image files)
     * - icons/ (icon files)
     * - assets/ (static assets)
     * - public/ (public files)
     * - .*\..* (files with extensions)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|.*\..*|images/.*|icons/.*|assets/.*|public/.*).*)",
  ],
}
