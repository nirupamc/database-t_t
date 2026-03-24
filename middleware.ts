import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  // Always allow these paths without any auth check
  if (
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon') ||
    nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  console.log('[Middleware] Path:', nextUrl.pathname)

  try {
    // Use NextAuth v5 getToken() instead of manual decoding - Edge Runtime compatible
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log('[Middleware] Token found:', !!token)
    console.log('[Middleware] Token role:', token?.role)

    const isLoggedIn = !!token
    const role = token?.role?.toUpperCase() || ''
    const isLoginPage = nextUrl.pathname === '/login'

    // Not logged in
    if (!isLoggedIn) {
      if (isLoginPage) return NextResponse.next()
      console.log('[Middleware] Not authenticated, redirecting to login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Logged in on login page - redirect based on role
    if (isLoginPage) {
      if (role === 'ADMIN') {
        console.log('[Middleware] Admin on login page, redirecting to /admin')
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      console.log('[Middleware] Non-admin on login page, redirecting to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Root path - redirect based on role
    if (nextUrl.pathname === '/') {
      if (role === 'ADMIN') {
        console.log('[Middleware] Admin at root, redirecting to /admin')
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      console.log('[Middleware] Non-admin at root, redirecting to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Admin route protection
    if (nextUrl.pathname.startsWith('/admin')) {
      if (role !== 'ADMIN') {
        console.log('[Middleware] Non-admin accessing /admin, redirecting to /dashboard')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      console.log('[Middleware] Admin accessing /admin, allowing')
    }

    return NextResponse.next()

  } catch (error) {
    console.error('[Middleware] Error getting token:', error)

    // Fallback: redirect to login on any error
    if (nextUrl.pathname !== '/login') {
      console.log('[Middleware] Token error, redirecting to login')
      return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}
