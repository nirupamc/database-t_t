import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const userRole = session?.user?.role

  console.log('[Middleware] Path:', nextUrl.pathname)
  console.log('[Middleware] IsLoggedIn:', isLoggedIn)
  console.log('[Middleware] Role:', userRole)

  // Public paths that don't need auth
  const isPublicPath =
    nextUrl.pathname === '/login' ||
    nextUrl.pathname === '/api/auth/callback/credentials' ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/_next') ||
    nextUrl.pathname.startsWith('/favicon')

  // Allow public paths
  if (isPublicPath) {
    // If logged in and trying to access login page
    // redirect to appropriate dashboard
    if (isLoggedIn && nextUrl.pathname === '/login') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Not logged in — redirect to login
  if (!isLoggedIn) {
    console.log('[Middleware] Not logged in, redirecting to login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Admin trying to access recruiter routes
  if (nextUrl.pathname.startsWith('/dashboard') &&
      userRole === 'admin') {
    // Allow admin to access dashboard too
    return NextResponse.next()
  }

  // Recruiter trying to access admin routes
  if (nextUrl.pathname.startsWith('/admin') &&
      userRole !== 'admin') {
    console.log('[Middleware] Non-admin trying to access admin')
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
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
