// app/admin/contests/page.tsx
// SERVER COMPONENT
// Lists every contest (active + archived) with:
//   - Week number, status badge, date range
//   - Total votes across all artworks
//   - Link to the live contest page
//   - Archive button (for active contests only)

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArchiveContestButton } from '@/components/admin/ArchiveContestButton'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contests' }

// No cache — admin needs real-time data
export const revalidate = 0

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    archived: 'bg-gray-700/50 text-gray-500 border-gray-700',
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? styles.archived}`}
    >
      {status === 'active' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default async function AdminContestsPage() {
  const supabase = await createClient()

  const { data: contests, error } = await supabase
    .from('contests')
    .select(`
      id, week_number, status, start_date, end_date, created_at,
      artworks ( vote_count )
    `)
    .order('week_number', { ascending: false })

  if (error) {
    return (
      <div className="py-12 text-center text-red-400 text-sm">
        Failed to load contests. Check your Supabase connection.
      </div>
    )
  }

  const rows = (contests ?? []).map((c) => ({
    ...c,
    totalVotes: ((c.artworks ?? []) as { vote_count: number }[])
      .reduce((sum, a) => sum + (a.vote_count ?? 0), 0),
  }))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Contests</h1>
          <p className="text-gray-400 text-sm mt-1">
            {rows.length} total &mdash; {rows.filter((c) => c.status === 'active').length} active
          </p>
        </div>
        <Link
          href="/admin/contests/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Contest
        </Link>
      </div>

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-gray-500 text-sm mb-4">No contests yet.</p>
          <Link
            href="/admin/contests/new"
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Create your first contest &rarr;
          </Link>
        </div>
      )}

      {/* Contests table */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {rows.map((contest) => (
            <div
              key={contest.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                {/* Left: week + status + dates */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-bold text-white text-sm">
                      Week {contest.week_number}
                    </span>
                    <StatusPill status={contest.status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(contest.start_date)} &ndash; {formatDate(contest.end_date)}
                  </p>
                </div>

                {/* Centre: vote count */}
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold text-white tabular-nums">
                    {contest.totalVotes.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">votes</p>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* View live page */}
                  <Link
                    href={`/contest/${contest.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    View
                  </Link>

                  {/* Archive — only for active contests */}
                  {contest.status === 'active' && (
                    <ArchiveContestButton
                      contestId={contest.id}
                      weekNumber={contest.week_number}
                    />
                  )}

                  {contest.status === 'archived' && (
                    <Link
                      href={`/archive/${contest.week_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      Archive page
                    </Link>
                  )}
                </div>
              </div>

              {/* Mobile vote count */}
              <div className="sm:hidden mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                {contest.totalVotes.toLocaleString()} votes cast
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
