import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;

  const isAuthRoute = pathname.startsWith("/login");
  const isAdminRoute = pathname.startsWith("/admin");
  const isRecruiterRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/add-candidate") || pathname.startsWith("/settings");

  if ((isAdminRoute || isRecruiterRoute) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isRecruiterRoute && role !== "recruiter") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/add-candidate/:path*", "/settings/:path*", "/login"],
};
