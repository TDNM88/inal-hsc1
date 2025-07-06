import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 giờ
  response.headers.set('Vary', 'Origin');
  return response;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Lấy origin từ request
  const origin = request.headers.get('origin') || '';

  // Kiểm tra origin có trong danh sách cho phép không
  const isAllowedOrigin = allowedOrigins.includes(origin) ||
    (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost'));

  // Xử lý preflight request (OPTIONS)
  if (request.method === 'OPTIONS') {
    if (!isAllowedOrigin) {
      return new NextResponse(null, { status: 403 });
    }

    const preflightResponse = new NextResponse(null, { status: 204 });
    return setCorsHeaders(preflightResponse, origin);
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
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/icons/")
  ) {
    return response;
  }

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // If no token and trying to access protected route
  if (!token && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
