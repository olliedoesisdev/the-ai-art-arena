'use client'
// Extracted client component so Header can stay a server component
// while still highlighting the active link via usePathname.

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { href: '/', label: 'This Week' },
  { href: '/archive', label: 'Archive' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/about', label: 'About' },
]

export { NAV_LINKS }

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {NAV_LINKS.map((link) => {
        // Exact match for home, prefix match for everything else
        const isActive =
          link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
