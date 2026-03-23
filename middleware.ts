import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  // Read the session token cookie directly
  // NextAuth v5 uses different cookie names depending on environment
  const sessionToken =
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value

  console.log('[Middleware] Path:', nextUrl.pathname)
  console.log('[Middleware] Has session cookie:', !!sessionToken)
  console.log('[Middleware] All cookies:',
    req.cookies.getAll().map(c => c.name).join(', '))

  const isLoggedIn = !!sessionToken
  const isLoginPage = nextUrl.pathname === '/login'

  // Not logged in
  if (!isLoggedIn) {
    if (isLoginPage) return NextResponse.next()
    console.log('[Middleware] No cookie, redirecting to login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Helper function to decode JWT payload
  function decodeJWT(token: string) {
    try {
      const payload = JSON.parse(
        Buffer.from(
          token.split('.')[1],
          'base64'
        ).toString()
      )
      return payload
    } catch {
      return null
    }
  }

  // Logged in on login page
  if (isLoginPage) {
    try {
      const payload = decodeJWT(sessionToken)
      console.log('[Middleware] JWT payload role:', payload?.role)

      const role = (payload?.role || '').toUpperCase()

      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } catch {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Root path
  if (nextUrl.pathname === '/') {
    try {
      const payload = decodeJWT(sessionToken)
      const role = (payload?.role || '').toUpperCase()

      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } catch {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Admin route protection
  if (nextUrl.pathname.startsWith('/admin')) {
    try {
      const payload = decodeJWT(sessionToken)
      const role = (payload?.role || '').toUpperCase()

      if (role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}
