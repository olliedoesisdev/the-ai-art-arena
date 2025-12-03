// proxy.ts
// Proxy runs on every request before the page is rendered.
// We use it for two purposes:
// 1. Add security headers to all responses
// 2. Protect routes that require authentication

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// The proxy function is called for every request that matches
// the matcher configuration at the bottom of this file.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user is authenticated by calling the auth function.
  // This works in proxy because NextAuth v5 is designed to work
  // in edge runtime environments.
  const session = await auth()

  // List of routes that require authentication.
  // If someone tries to access these routes without being signed in,
  // we redirect them to the sign-in page.
  const protectedRoutes = ['/profile', '/admin']

  // Check if the current request is for a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  // If this is a protected route and user is not signed in, redirect
  if (isProtectedRoute && !session) {
    // Store the original URL they were trying to access so we can
    // redirect them back after they sign in
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If user is signed in and trying to access sign-in page,
  // redirect them to home since they are already authenticated
  if (session && pathname === '/signin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Create the response object
  const response = NextResponse.next()

  // Add security headers to every response.
  // These headers protect against common web vulnerabilities.

  // Determine if we are in development or production
  const isDev = process.env.NODE_ENV === 'development'

  // Content Security Policy prevents XSS attacks by controlling
  // what resources can be loaded and where scripts can come from
  const csp = isDev
    ? "default-src 'self'; connect-src 'self' https://*.supabase.co ws://localhost:* ws://127.0.0.1:* http://localhost:*; img-src 'self' https://*.supabase.co data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    : "default-src 'self'; connect-src 'self' https://*.supabase.co; img-src 'self' https://*.supabase.co data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"

  response.headers.set('Content-Security-Policy', csp)

  // X-Frame-Options prevents clickjacking attacks by preventing
  // your site from being embedded in an iframe
  response.headers.set('X-Frame-Options', 'DENY')

  // X-Content-Type-Options prevents MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy controls how much referrer information is sent
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // X-XSS-Protection enables the browser's XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Permissions-Policy controls which browser features can be used
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Strict-Transport-Security forces HTTPS (only in production)
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  return response
}

// The matcher configuration tells Next.js which routes should run proxy.
// We exclude static files and Next.js internal routes because those do not
// need authentication checks or security headers (Next.js handles them).
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
