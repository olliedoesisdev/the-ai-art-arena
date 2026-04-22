// app/not-found.tsx
// SERVER COMPONENT - no 'use client'
// Rendered automatically by Next.js whenever:
//   - A route does not exist
//   - notFound() is called from a page (e.g. contest ID not in DB)
// The Header is already present via layout.tsx so this just
// needs to fill the content area.

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'This page does not exist.',
}

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* Big 404 */}
        <p className="text-8xl font-black text-transparent bg-clip-text bg-linear-to-b from-purple-400 to-purple-700 select-none mb-6">
          404
        </p>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-purple-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Page not found
        </h1>

        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          This page does not exist or may have been moved.
          If you were looking for a contest, it may have been archived.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            This Week&apos;s Contest
          </Link>
          <Link
            href="/archive"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 transition-colors"
          >
            Browse Archive
          </Link>
        </div>

      </div>
    </div>
  )
}
