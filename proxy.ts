// proxy.ts
// Proxy runs on every request before the page is rendered.
// We use it for three purposes:
// 1. Add security headers to all responses
// 2. Protect routes that require authentication
// 3. Protect admin routes with role-based access control

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  // Get the user session
  const session = await auth()

  // ===========================================
  // ADMIN ROUTE PROTECTION (NEW!)
  // ===========================================

  // Check if accessing admin routes
  if (pathname.startsWith('/admin')) {
    // Redirect to signin if not authenticated
    if (!session?.user) {
      const signInUrl = new URL('/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Check if user has admin role
    // Admin emails are configured in environment variables
    const adminEmails =
      process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    const isAdmin = adminEmails.includes(session.user.email || '')

    if (!isAdmin) {
      // Not an admin - redirect to homepage with error message
      console.warn(
        `Unauthorized admin access attempt by: ${session.user.email}`
      )
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }

    // Log admin access for security audit trail
    console.log(`Admin access: ${session.user.email} → ${pathname}`)
  }

  // ===========================================
  // ADMIN API PROTECTION (NEW!)
  // ===========================================

  if (pathname.startsWith('/api/admin')) {
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    const adminEmails =
      process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    const isAdmin = adminEmails.includes(session.user.email || '')

    if (!isAdmin) {
      console.warn(
        `Unauthorized admin API access attempt by: ${session.user.email}`
      )
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }
  }

  // ===========================================
  // REGULAR AUTHENTICATION PROTECTION
  // ===========================================

  // List of routes that require authentication (non-admin)
  const protectedRoutes = ['/profile']

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !session) {
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If user is signed in and trying to access sign-in page,
  // redirect them to home
  if (session && pathname === '/signin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // ===========================================
  // SECURITY HEADERS
  // ===========================================

  const response = NextResponse.next()

  // Content Security Policy - now includes picsum.photos
  const csp = isDev
    ? "default-src 'self'; connect-src 'self' https://*.supabase.co ws://localhost:* ws://127.0.0.1:* http://localhost:*; img-src 'self' https://*.supabase.co https://picsum.photos data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    : "default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' https://*.supabase.co https://picsum.photos data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"

  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // HTTPS enforcement in production
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
