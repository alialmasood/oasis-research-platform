import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProduction = process.env.NODE_ENV === "production";

/** في الإنتاج: إجبار HTTPS لحماية بيانات الاعتماد أثناء النقل */
function ensureHttps(request: NextRequest): NextResponse | null {
  if (!isProduction) return null;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "");
  if (proto === "https") return null;
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = request.headers.get("x-forwarded-host") ?? request.nextUrl.host;
  return NextResponse.redirect(url, 301);
}

export function proxy(request: NextRequest) {
  const httpsRedirect = ensureHttps(request);
  if (httpsRedirect) return httpsRedirect;

  // Allow public routes
  const publicRoutes = ["/", "/login", "/register", "/api/auth/login"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  // Check for session cookie
  const session = request.cookies.get("session");

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
