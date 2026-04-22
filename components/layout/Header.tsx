// components/layout/Header.tsx
// SERVER COMPONENT
// Sticky top nav rendered on every page via app/layout.tsx.
// NavLinks and MobileMenu are client components (need usePathname).

import Link from 'next/link'
import { NavLinks, NAV_LINKS } from './NavLinks'
import { MobileMenu } from './MobileMenu'

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="AI Art Arena home"
        >
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight hidden sm:block">
            AI Art Arena
          </span>
        </Link>

        {/* Desktop nav — client component for active state */}
        <NavLinks />

        {/* Mobile menu */}
        <MobileMenu links={NAV_LINKS} />

      </div>
    </header>
  )
}
