// components/ui/Skeleton.tsx
// Loading placeholder components that create a smooth perceived performance
// by showing content-shaped placeholders while actual data loads.

import { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  // Shape of the skeleton (matches common UI patterns)
  variant?: 'text' | 'circular' | 'rectangular'

  // Width of the skeleton (can be responsive)
  width?: string

  // Height of the skeleton
  height?: string
}

/**
 * Skeleton loading placeholder.
 *
 * Skeletons improve perceived performance by showing users that content is
 * loading and approximately what shape that content will take. This prevents
 * the jarring experience of staring at a blank screen.
 *
 * Example usage:
 *
 * // Text loading placeholder
 * <Skeleton variant="text" width="200px" />
 *
 * // Image loading placeholder
 * <Skeleton variant="rectangular" width="100%" height="300px" />
 */
export function Skeleton({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const baseStyles = 'animate-pulse bg-gray-200'

  const variantStyles = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const skeletonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${className}
  `
    .trim()
    .replace(/\s+/g, ' ')

  const inlineStyles = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height:
      height ||
      (variant === 'circular' ? '40px' : variant === 'text' ? '1rem' : '200px'),
    ...style,
  }

  return <div className={skeletonStyles} style={inlineStyles} {...props} />
}

/**
 * Pre-composed skeleton for artwork cards.
 * This matches the structure of your actual artwork cards, creating
 * a seamless transition when the real content loads.
 */
export function ArtworkCardSkeleton() {
  return (
    <div className="space-y-3">
      {/* Image placeholder */}
      <Skeleton variant="rectangular" height="300px" />

      {/* Title placeholder */}
      <Skeleton variant="text" width="75%" />

      {/* Vote count placeholder */}
      <Skeleton variant="text" width="50%" height="0.875rem" />
    </div>
  )
}

/**
 * Pre-composed skeleton for contest cards on archive page.
 */
export function ContestCardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Thumbnail */}
      <Skeleton variant="rectangular" height="200px" />

      {/* Title */}
      <Skeleton variant="text" width="80%" />

      {/* Meta info */}
      <div className="flex gap-4">
        <Skeleton variant="text" width="100px" height="0.875rem" />
        <Skeleton variant="text" width="100px" height="0.875rem" />
      </div>
    </div>
  )
}
