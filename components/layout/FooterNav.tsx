'use client'
// Client component so Footer can highlight the active link via usePathname.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_LINKS } from './NavLinks'

export function FooterNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 flex-wrap justify-center" aria-label="Footer navigation">
      {NAV_LINKS.map((link) => {
        const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1.5 text-sm transition-colors ${
              isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
