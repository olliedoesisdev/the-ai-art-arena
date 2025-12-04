// lib/supabase/client.ts
// Client-side Supabase client for use in Client Components.
// This client runs in the browser and respects Row Level Security policies.

import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client configured for client-side use.
 *
 * This client:
 * - Works in Client Components (components with 'use client')
 * - Runs in the browser
 * - Uses the anon key (safe to expose)
 * - Respects Row Level Security policies
 *
 * Note: This function creates a new client on every call.
 * For components that render frequently, consider memoizing the client
 * or moving database queries to Server Components.
 *
 * @returns A configured Supabase client
 *
 * @example
 * // In a Client Component
 * 'use client'
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function VoteButton({ artworkId }) {
 *   async function handleVote() {
 *     const supabase = createClient()
 *     await supabase.from('votes').insert({ artwork_id: artworkId })
 *   }
 *   return <button onClick={handleVote}>Vote</button>
 * }
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
