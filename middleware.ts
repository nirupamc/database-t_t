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

  console.log('[Middleware] Path:', nextUrl.pathname)

  // Check for session cookie (NextAuth v5 uses authjs prefix)
  const sessionToken =
    req.cookies.get('__Secure-authjs.session-token')?.value ||
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value

  console.log('[Middleware] Session cookie found:', !!sessionToken)
  console.log('[Middleware] Available cookies:', req.cookies.getAll().map(c => c.name).join(', '))

  const isLoginPage = nextUrl.pathname === '/login'
  const isLoggedIn = !!sessionToken

  // Not logged in - redirect to login
  if (!isLoggedIn) {
    if (isLoginPage) return NextResponse.next()
    console.log('[Middleware] No session cookie, redirecting to login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // For logged in users, we need to check their role
  // Since getToken() isn't working in Edge Runtime, we'll do a different approach

  // Logged in on login page - fetch role via internal API call
  if (isLoginPage) {
    console.log('[Middleware] User on login page with session, fetching role...')

    try {
      // Make internal request to get session data
      const sessionResponse = await fetch(new URL('/api/auth/session', req.url), {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      })

      if (sessionResponse.ok) {
        const session = await sessionResponse.json()
        const role = session?.user?.role?.toUpperCase() || ''

        console.log('[Middleware] Fetched role from session API:', role)

        if (role === 'ADMIN') {
          console.log('[Middleware] Admin on login page, redirecting to /admin')
          return NextResponse.redirect(new URL('/admin', req.url))
        }
        console.log('[Middleware] Non-admin on login page, redirecting to /dashboard')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('[Middleware] Error fetching session:', error)
    }

    // Fallback to dashboard if we can't determine role
    console.log('[Middleware] Could not determine role, redirecting to /dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Root path redirect - same approach
  if (nextUrl.pathname === '/') {
    try {
      const sessionResponse = await fetch(new URL('/api/auth/session', req.url), {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      })

      if (sessionResponse.ok) {
        const session = await sessionResponse.json()
        const role = session?.user?.role?.toUpperCase() || ''

        if (role === 'ADMIN') {
          console.log('[Middleware] Admin at root, redirecting to /admin')
          return NextResponse.redirect(new URL('/admin', req.url))
        }
        console.log('[Middleware] Non-admin at root, redirecting to /dashboard')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (error) {
      console.error('[Middleware] Error fetching session at root:', error)
    }

    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Admin route protection - same approach
  if (nextUrl.pathname.startsWith('/admin')) {
    try {
      const sessionResponse = await fetch(new URL('/api/auth/session', req.url), {
        headers: {
          cookie: req.headers.get('cookie') || '',
        },
      })

      if (sessionResponse.ok) {
        const session = await sessionResponse.json()
        const role = session?.user?.role?.toUpperCase() || ''

        if (role !== 'ADMIN') {
          console.log('[Middleware] Non-admin accessing /admin, redirecting to /dashboard')
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
        console.log('[Middleware] Admin accessing /admin, allowing')
      }
    } catch (error) {
      console.error('[Middleware] Error checking admin access:', error)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ],
}
