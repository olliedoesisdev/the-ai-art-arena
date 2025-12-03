// app/api/auth/[...nextauth]/route.ts
// This file creates the API endpoints that NextAuth needs to function.
// The [...nextauth] folder name is special syntax that creates a catch-all route.
// This single file handles all of these endpoints:
//   - /api/auth/signin
//   - /api/auth/signout
//   - /api/auth/callback/github
//   - /api/auth/callback/resend
//   - /api/auth/session
//   - /api/auth/providers
//   - /api/auth/csrf
// NextAuth internally routes to the correct handler based on the URL.

import { handlers } from '@/auth'

// The handlers object from our auth.ts file contains GET and POST functions
// that handle all the authentication endpoints. We simply export them here.
// NextAuth will automatically route requests to the correct handler.
export const { GET, POST } = handlers

// That is it! This might seem too simple, but NextAuth handles all the complexity
// internally. When a user clicks "Sign in with GitHub," the browser sends a request
// to /api/auth/signin/github, which hits this route, and NextAuth takes over from there.
