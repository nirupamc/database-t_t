import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role;

  // Add debugging
  console.log("[Middleware]", {
    pathname,
    hasToken: !!token,
    role: token?.role,
    email: token?.email,
    tokenKeys: token ? Object.keys(token) : [],
  });

  const isAuthRoute = pathname.startsWith("/login");
  const isAdminRoute = pathname.startsWith("/admin");
  const isRecruiterRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/add-candidate") || pathname.startsWith("/settings");

  // Check if this is a NextAuth callback (signout redirect) or explicit signout
  const hasCallbackUrl = searchParams.has("callbackUrl");
  const isExplicitSignout = searchParams.get("signout") === "true";

  if ((isAdminRoute || isRecruiterRoute) && !token) {
    console.log("[Middleware] No token, redirecting to login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && role !== "admin") {
    console.log("[Middleware] Not admin, redirecting to dashboard");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isRecruiterRoute && role === "admin") {
    console.log("[Middleware] Admin accessing recruiter route, redirecting to admin");
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Allow access to login page during NextAuth signout flow or explicit signout
  if (isAuthRoute && token && !hasCallbackUrl && !isExplicitSignout) {
    console.log("[Middleware] Authenticated user on login page, redirecting to dashboard");
    return NextResponse.redirect(new URL(role === "admin" ? "/admin" : "/dashboard", request.url));
  }

  console.log("[Middleware] Allowing request to continue");
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/add-candidate/:path*", "/settings/:path*", "/login"],
};
