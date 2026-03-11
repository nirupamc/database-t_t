import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE = "hireflow-role";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ADMIN_COOKIE)?.value;

  if ((pathname.startsWith("/admin") || pathname.startsWith("/candidates")) && role !== "admin") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && role === "admin") {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  if (pathname === "/login" && role === "recruiter") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/candidates/:path*", "/login"],
};
