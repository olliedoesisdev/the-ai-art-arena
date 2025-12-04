// components/ui/Card.tsx
// A reusable card container component that provides consistent visual
// treatment for grouped content throughout the application.

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode

  // Whether the card should have hover effects (useful for clickable cards)
  hoverable?: boolean

  // Padding variants for different content densities
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * Card component for containing and organizing related content.
 *
 * Cards provide visual grouping and hierarchy in your interface. They work
 * well for displaying artworks, contest information, user profiles, or any
 * content that benefits from being contained in a distinct visual boundary.
 *
 * Example usage:
 *
 * <Card hoverable onClick={() => navigate('/contest/123')}>
 *   <h3>Week 1: Fantasy Landscapes</h3>
 *   <p>6 artworks • 245 votes</p>
 * </Card>
 */
export function Card({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  const baseStyles =
    'bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-200'

  const hoverStyles = hoverable
    ? 'cursor-pointer hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5'
    : ''

  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const cardStyles = `
    ${baseStyles}
    ${hoverStyles}
    ${paddingStyles[padding]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ')

  return (
    <div className={cardStyles} {...props}>
      {children}
    </div>
  )
}
