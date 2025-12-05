// proxy.ts
// Proxy runs on every request before the page is rendered.
// We use it for:
// 1. Add security headers to all responses
// 2. Protect routes that require authentication
// 3. Protect admin routes with role-based access control
// 4. Log security events

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ✅ OPTIMIZATION 1: Cache admin emails for performance
let cachedAdminEmails: string[] | null = null

function getAdminEmails(): string[] {
  if (cachedAdminEmails === null) {
    cachedAdminEmails =
      process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []

    // ✅ Warn if no admin emails configured
    if (cachedAdminEmails.length === 0) {
      console.warn('⚠️ No ADMIN_EMAILS configured in environment variables!')
    }
  }
  return cachedAdminEmails
}

// ✅ OPTIMIZATION 2: Helper to check admin status
function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email)
}

// ✅ OPTIMIZATION 3: Security event logging
function logSecurityEvent(
  event: 'admin_access' | 'unauthorized_attempt' | 'admin_api_access',
  email: string | undefined,
  path: string
) {
  const timestamp = new Date().toISOString()

  if (event === 'unauthorized_attempt') {
    console.warn(
      `[${timestamp}] 🚨 UNAUTHORIZED: ${email || 'anonymous'} → ${path}`
    )
  } else {
    console.log(`[${timestamp}] ✅ ${event.toUpperCase()}: ${email} → ${path}`)
  }

  // TODO: In production, send to monitoring service (Sentry, DataDog, etc.)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  // ✅ OPTIMIZATION 4: Skip auth checks for public static assets
  // This improves performance by not hitting auth for images, etc.
  const publicPaths = [
    '/_next',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/api/health', // Add health check endpoint
  ]

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (isPublicPath) {
    const response = NextResponse.next()
    // Still add security headers to static assets
    addSecurityHeaders(response, isDev)
    return response
  }

  // Get the user session
  const session = await auth()

  // ===========================================
  // ADMIN PAGE PROTECTION
  // ===========================================

  if (pathname.startsWith('/admin')) {
    // Redirect to signin if not authenticated
    if (!session?.user) {
      const signInUrl = new URL('/signin', request.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    // Check if user has admin role
    if (!isAdmin(session.user.email)) {
      logSecurityEvent('unauthorized_attempt', session.user.email, pathname)

      // ✅ OPTIMIZATION 5: Better error handling
      const errorUrl = new URL('/', request.url)
      errorUrl.searchParams.set('error', 'unauthorized')
      errorUrl.searchParams.set('message', 'Admin access required')
      return NextResponse.redirect(errorUrl)
    }

    // Log admin access for security audit trail
    logSecurityEvent('admin_access', session.user.email, pathname)
  }

  // ===========================================
  // ADMIN API PROTECTION
  // ===========================================

  if (pathname.startsWith('/api/admin')) {
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      )
    }

    if (!isAdmin(session.user.email)) {
      logSecurityEvent('unauthorized_attempt', session.user.email, pathname)

      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    logSecurityEvent('admin_api_access', session.user.email, pathname)
  }

  // ===========================================
  // REGULAR AUTHENTICATION PROTECTION
  // ===========================================

  // List of routes that require authentication (non-admin)
  const protectedRoutes = ['/profile', '/settings']

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
  // RETURN WITH SECURITY HEADERS
  // ===========================================

  const response = NextResponse.next()
  addSecurityHeaders(response, isDev)

  return response
}

// ✅ OPTIMIZATION 6: Extract security headers into reusable function
function addSecurityHeaders(response: NextResponse, isDev: boolean) {
  // Content Security Policy
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

  // ✅ OPTIMIZATION 7: Add cache control for better performance
  // Don't cache pages with user-specific content
  if (response.headers.get('Content-Type')?.includes('text/html')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
