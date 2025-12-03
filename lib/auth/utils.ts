// lib/auth/utils.ts
// Utility functions for working with authentication throughout the application.
// These functions abstract away the details of NextAuth and provide a simple
// interface for checking authentication state and protecting routes.

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

/**
 * Gets the currently authenticated user's session.
 * Returns null if no user is signed in.
 *
 * Use this in Server Components when you want to optionally show different
 * content based on whether someone is signed in.
 *
 * Example:
 *   const session = await getCurrentUser()
 *   if (session) {
 *     // Show personalized content
 *   } else {
 *     // Show generic content
 *   }
 */
export async function getCurrentUser() {
  const session = await auth()
  return session
}

/**
 * Requires that a user be authenticated to access a page.
 * If no user is signed in, automatically redirects to the sign-in page.
 * If a user is signed in, returns their session.
 *
 * Use this in Server Components for pages that should only be accessible
 * to authenticated users.
 *
 * Example:
 *   const session = await requireAuth()
 *   // If we get here, we know the user is signed in
 *   const userId = session.user.id
 */
export async function requireAuth() {
  const session = await auth()

  if (!session) {
    // No session means no user signed in. Redirect to sign-in page.
    redirect('/signin')
  }

  return session
}

/**
 * Checks if a user is authenticated without redirecting.
 * Returns true if signed in, false otherwise.
 *
 * Use this when you need to check authentication but want to handle
 * the unauthenticated case yourself rather than automatically redirecting.
 *
 * Example:
 *   const isAuthenticated = await isAuth()
 *   if (!isAuthenticated) {
 *     return <div>Please sign in to vote</div>
 *   }
 */
export async function isAuth(): Promise<boolean> {
  const session = await auth()
  return !!session
}

/**
 * Gets the current user's ID if they are signed in.
 * Returns null if not signed in.
 *
 * This is a convenience function for the common case where you just need
 * the user ID rather than the entire session object.
 *
 * Example:
 *   const userId = await getUserId()
 *   if (userId) {
 *     // Load user-specific data
 *   }
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
