// app/contest/[id]/error.tsx
'use client'
// CLIENT COMPONENT - error boundaries must be client components

import { useEffect } from 'react'

interface ContestErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ContestError({ error, reset }: ContestErrorProps) {
  useEffect(() => {
    // Log to error monitoring (Sentry etc) when available
    console.error('Contest page error:', error)
  }, [error])

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">
          Failed to Load Contest
        </h2>

        <p className="text-gray-400 text-sm mb-8">
          {error.message || 'Something went wrong loading this contest.'}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </main>
  )
}
