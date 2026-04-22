// app/admin/layout.tsx
// SERVER COMPONENT
// Wraps every /admin/* page with a sidebar nav.
// Auth guard lives in middleware.ts — any request reaching here
// is already confirmed to be an admin role.

import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s | Admin — AI Art Arena',
  },
}

const ADMIN_NAV = [
  {
    href: '/admin',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: '/admin/contests',
    label: 'Contests',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    href: '/admin/contests/new',
    label: 'New Contest',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8">

          {/* Sidebar */}
          <aside className="w-48 shrink-0 hidden md:block">
            {/* Admin badge */}
            <div className="flex items-center gap-2 px-3 py-2 mb-6">
              <div className="w-6 h-6 rounded bg-purple-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin
              </span>
            </div>

            <nav className="flex flex-col gap-1">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Back to site */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to site
              </Link>
            </div>
          </aside>

          {/* Page content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}
