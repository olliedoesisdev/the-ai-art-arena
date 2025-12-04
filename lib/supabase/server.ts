// lib/supabase/server.ts
// Server-side Supabase client for use in Server Components, API Routes, and Server Actions.
// This client properly handles cookies for authentication state and can use the
// service role key for admin operations if needed.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client configured for server-side use.
 *
 * This client:
 * - Works in Server Components (can use async/await)
 * - Handles authentication cookies properly
 * - Respects Row Level Security policies
 * - Should be used for all server-side database operations
 *
 * @returns A configured Supabase client
 *
 * @example
 * // In a Server Component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = await createClient()
 *   const { data } = await supabase.from('contests').select('*')
 *   return <div>{data.map(...)}</div>
 * }
 */
export async function createClient() {
  // Get the cookies from the incoming request
  // The await here is necessary because Next.js 15+ requires
  // awaiting the cookies() function
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Get a cookie value
        get(name: string) {
          return cookieStore.get(name)?.value
        },

        // Set a cookie value
        // This is called by Supabase when authentication state changes
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The set method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions, which we do.
          }
        },

        // Remove a cookie
        // This is called when logging out
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The delete method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions, which we do.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with admin privileges (bypasses RLS).
 *
 * USE WITH EXTREME CAUTION. This client:
 * - Bypasses all Row Level Security policies
 * - Has full read/write access to all data
 * - Should only be used in server-side code
 * - Should only be used for legitimate admin operations
 *
 * @returns A configured Supabase admin client
 *
 * @example
 * // Only use for admin operations
 * import { createAdminClient } from '@/lib/supabase/server'
 *
 * export async function deleteOldContests() {
 *   const supabase = await createAdminClient()
 *   await supabase.from('contests').delete().lt('created_at', oldDate)
 * }
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key bypasses RLS
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Ignore
          }
        },
      },
    }
  )
}
