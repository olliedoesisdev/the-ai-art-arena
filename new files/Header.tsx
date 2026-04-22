// components/layout/Header.tsx
// SERVER COMPONENT - no 'use client'
// Main site navigation. Renders on every page via app/layout.tsx.
// MobileMenu is injected as a client component for the hamburger toggle.
// Active link highlighting is handled inside MobileMenu (needs usePathname).
// Desktop active states use a CSS approach via aria-current.

import Link from 'next/link'
import { MobileMenu } from './MobileMenu'

// Single source of truth for all nav links.
// MobileMenu and desktop nav both consume this array.
const NAV_LINKS = [
  { href: '/', label: 'This Week' },
  { href: '/archive', label: 'Archive' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/about', label: 'About' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
          aria-label="AI Art Arena home"
        >
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:shadow-purple-700/40 transition-shadow">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Wordmark */}
          <span className="font-bold text-white text-sm tracking-tight hidden sm:block">
            AI Art Arena
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="
                px-4 py-2 rounded-lg text-sm font-medium text-gray-400
                hover:text-white hover:bg-gray-800
                transition-colors duration-150
                aria-[current=page]:text-white aria-[current=page]:bg-purple-600/20
              "
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: mobile menu */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger - client component */}
          <MobileMenu links={NAV_LINKS} />
        </div>

      </div>
    </header>
  )
}
