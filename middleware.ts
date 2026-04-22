// middleware.ts
// Runs at the edge before every request.
// Responsibilities:
//   1. Protect /admin/* routes — redirect unauthenticated users to /signin
//   2. Redirect already-signed-in users away from /signin
//   3. Add security headers to every response

import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  // ── Admin route protection ──────────────────────────────────────
  // Block access to /admin and every sub-route for unauthenticated users.
  // The admin layout also checks this server-side, but doing it in middleware
  // means the redirect happens at the edge before any page code runs.
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      const signInUrl = new URL('/signin', nextUrl.origin)
      signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  // ── Skip /signin if already logged in ──────────────────────────
  if (nextUrl.pathname === '/signin' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', nextUrl.origin))
  }

  // ── Security headers ────────────────────────────────────────────
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
})

// Run middleware on all routes except static files and Next.js internals
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
