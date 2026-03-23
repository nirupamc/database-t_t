import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
    cookieName: process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token',
  })

  const isLoggedIn = !!token
  const userRole = (token?.role as string || '').toUpperCase()

  console.log('[Middleware] Path:', nextUrl.pathname)
  console.log('[Middleware] Token exists:', isLoggedIn)
  console.log('[Middleware] Role:', userRole)

  // Always allow these paths
  if (
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon') ||
    nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isLoginPage = nextUrl.pathname === '/login'

  // Not logged in
  if (!isLoggedIn) {
    if (isLoginPage) return NextResponse.next()
    console.log('[Middleware] No token, redirecting to login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Logged in on login page → redirect to dashboard
  if (isLoginPage) {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Root redirect
  if (nextUrl.pathname === '/') {
    if (userRole === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Non-admin trying to access /admin
  if (nextUrl.pathname.startsWith('/admin') &&
      userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}
