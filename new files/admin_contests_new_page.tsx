// app/admin/contests/new/page.tsx
// SERVER COMPONENT
// Calculates the next week number from the DB, then renders
// the NewContestForm client component with it pre-filled.

import { createClient } from '@/lib/supabase/server'
import { NewContestForm } from '@/components/admin/NewContestForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Contest' }

export default async function NewContestPage() {
  const supabase = await createClient()

  // Find the highest existing week number so the form pre-fills correctly
  const { data } = await supabase
    .from('contests')
    .select('week_number')
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextWeekNumber = ((data?.week_number ?? 0) as number) + 1

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Contest</h1>
        <p className="text-gray-400 text-sm mt-1">
          Create Week {nextWeekNumber} and add up to 5 artworks.
        </p>
      </div>

      <NewContestForm nextWeekNumber={nextWeekNumber} />
    </div>
  )
}
