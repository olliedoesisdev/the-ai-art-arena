// components/contest/ContestHeader.tsx
// Displays contest information including title, description, and countdown timer.
// This is a Server Component that embeds a Client Component (the timer).

import { ContestTimer } from './ContestTimer'

type ContestHeaderProps = {
  title: string
  description: string | null
  weekNumber: number
  endDate: string
}

/**
 * Contest header showing title, metadata, and countdown timer.
 *
 * This component demonstrates the pattern of Server Components embedding
 * Client Components. The header itself is a Server Component (no interactivity
 * needed), but it renders the ContestTimer which is a Client Component
 * (needs to update every second).
 */
export function ContestHeader({
  title,
  description,
  weekNumber,
  endDate,
}: ContestHeaderProps) {
  return (
    <div className="mb-12 text-center">
      {/* Week number badge */}
      <div className="inline-block px-4 py-1 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
        Week {weekNumber}
      </div>

      {/* Contest title */}
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {title}
      </h1>

      {/* Description if provided */}
      {description && (
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
          {description}
        </p>
      )}

      {/* Countdown timer - Client Component embedded in Server Component */}
      <ContestTimer endDate={endDate} />

      {/* Voting instructions */}
      <p className="mt-4 text-sm text-gray-500">
        Click on an artwork to cast your vote • One vote per contest
      </p>
    </div>
  )
}
