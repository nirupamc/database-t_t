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
  console.log('[Middleware] Cookie value (first 50 chars):',
    sessionToken?.substring(0, 50))
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

  // Helper function to decode JWT payload with proper base64url handling
  function decodeJWT(token: string) {
    let role = ''
    try {
      // JWT has 3 parts separated by dots
      const parts = token.split('.')
      if (parts.length === 3) {
        // Add padding if needed for base64 decode
        // Also handle base64url encoding (- instead of +, _ instead of /)
        const base64 = parts[1]
          .replace(/-/g, '+')
          .replace(/_/g, '/')
        const padded = base64 + '='.repeat(
          (4 - base64.length % 4) % 4
        )
        const payload = JSON.parse(
          Buffer.from(padded, 'base64').toString('utf-8')
        )
        role = (payload.role || '').toUpperCase()
        console.log('[Middleware] Decoded role:', role)
        console.log('[Middleware] Full payload:',
          JSON.stringify(payload))
        return { payload, role }
      }
    } catch (e) {
      console.error('[Middleware] JWT decode error:', e)
    }
    return { payload: null, role: '' }
  }

  // Logged in on login page
  if (isLoginPage) {
    const { role } = decodeJWT(sessionToken)

    if (role === 'ADMIN') {
      console.log('[Middleware] Admin on login page, redirecting to /admin')
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    console.log('[Middleware] Non-admin on login page, redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Root path
  if (nextUrl.pathname === '/') {
    const { role } = decodeJWT(sessionToken)

    if (role === 'ADMIN') {
      console.log('[Middleware] Admin at root, redirecting to /admin')
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    console.log('[Middleware] Non-admin at root, redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Admin route protection
  if (nextUrl.pathname.startsWith('/admin')) {
    const { role } = decodeJWT(sessionToken)

    if (role !== 'ADMIN') {
      console.log('[Middleware] Non-admin accessing /admin (role:', role, '), redirecting to /dashboard')
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    console.log('[Middleware] Admin accessing /admin, allowing')
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}
