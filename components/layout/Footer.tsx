// components/layout/Footer.tsx
// SERVER COMPONENT
// Simple footer rendered on every page via app/layout.tsx.
// FooterNav is a client component so it can highlight the active link.

import { FooterNav } from './FooterNav'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">AI Art Arena</span>
          </div>

          {/* Nav links with active state */}
          <FooterNav />

          {/* Copyright */}
          <p className="text-sm text-gray-400">
            &copy; {year} AI Art Arena
          </p>

        </div>
      </div>
    </footer>
  )
}
