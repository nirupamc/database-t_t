import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { nextUrl } = req

  // Get token using next-auth/jwt getToken
  // This works more reliably on Vercel Edge Runtime
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    // Support both secure and non-secure cookies
    secureCookie: process.env.NODE_ENV === 'production',
  })

  const isLoggedIn = !!token
  const userRole = token?.role as string | undefined

  console.log('[Middleware] Path:', nextUrl.pathname)
  console.log('[Middleware] Token exists:', isLoggedIn)
  console.log('[Middleware] Role:', userRole)

  // Define public paths
  const isAuthPath = nextUrl.pathname.startsWith('/api/auth')
  const isLoginPath = nextUrl.pathname === '/login'
  const isStaticPath =
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon') ||
    nextUrl.pathname.startsWith('/public')

  // Always allow static and auth API paths
  if (isStaticPath || isAuthPath) {
    return NextResponse.next()
  }

  // If logged in and on login page → redirect to dashboard
  if (isLoggedIn && isLoginPath) {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // If not logged in and not on login page → redirect to login
  if (!isLoggedIn && !isLoginPath) {
    console.log('[Middleware] No token, redirecting to login')
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and trying to access admin as non-admin
  if (nextUrl.pathname.startsWith('/admin') &&
      userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Root path redirect
  if (nextUrl.pathname === '/') {
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
