// components/contest/ContestHeader.tsx
// SERVER COMPONENT - no 'use client'
// ContestTimer is a CLIENT component but can be imported here safely -
// Next.js handles the boundary automatically when a server component
// renders a client component as a child.

import { ContestHeaderProps } from '@/lib/types'
import { ContestTimer } from './ContestTimer'

function StatusBadge({ status }: { status: ContestHeaderProps['status'] }) {
  const styles = {
    active: 'bg-green-500/20 text-green-400 border border-green-500/30',
    archived: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    upcoming: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  }
  const labels = {
    active: 'Live Now',
    archived: 'Archived',
    upcoming: 'Coming Soon',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status === 'active' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      )}
      {labels[status]}
    </span>
  )
}

export function ContestHeader({
  weekNumber,
  endDate,
  status,
  totalVotes,
}: ContestHeaderProps) {
  return (
    <div className="mb-10">
      {/* Week label + status badge */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-sm font-medium text-gray-500 uppercase tracking-widest">
          Week {weekNumber}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Main heading */}
      <h1 className="text-4xl font-bold text-white mb-5">
        AI Art Arena
        <span className="text-purple-400 ml-3">#{weekNumber}</span>
      </h1>

      {/* Timer + meta row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Live countdown - client component */}
        {status === 'active' && (
          <ContestTimer endDate={endDate} status={status} />
        )}

        {/* Total votes */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg
            className="w-4 h-4 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>
            {totalVotes.toLocaleString()}{' '}
            {totalVotes === 1 ? 'vote' : 'votes'} cast
          </span>
        </div>

        {/* Artwork count */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg
            className="w-4 h-4 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>5 AI-generated artworks</span>
        </div>
      </div>

      <div className="mt-6 h-px bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-transparent" />
    </div>
  )
}
