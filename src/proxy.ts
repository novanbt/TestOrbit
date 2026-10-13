import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Guard all /admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("testorbit_admin_session")?.value;

    // If already logged in and visiting /admin/login, redirect to /admin
    if (pathname === "/admin/login") {
      if (sessionCookie) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Require session cookie for all other /admin routes
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
