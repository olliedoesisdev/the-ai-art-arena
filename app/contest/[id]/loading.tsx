// app/contest/[id]/loading.tsx
// Loading state shown while the contest page fetches data.
// This is a Server Component (no 'use client' needed).

import { Skeleton } from '@/components/ui/Skeleton'

export default function ContestLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-12 text-center space-y-4">
          {/* Week number badge skeleton */}
          <div className="flex justify-center">
            <Skeleton variant="rectangular" width="100px" height="28px" />
          </div>

          {/* Title skeleton */}
          <Skeleton
            variant="text"
            width="400px"
            height="40px"
            className="mx-auto"
          />

          {/* Description skeleton */}
          <Skeleton
            variant="text"
            width="600px"
            height="24px"
            className="mx-auto"
          />

          {/* Timer skeleton */}
          <div className="flex justify-center">
            <Skeleton variant="rectangular" width="200px" height="44px" />
          </div>
        </div>

        {/* Artworks grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="space-y-3">
              {/* Image skeleton */}
              <Skeleton variant="rectangular" width="100%" height="300px" />

              {/* Title skeleton */}
              <Skeleton variant="text" width="75%" />

              {/* Vote count skeleton */}
              <Skeleton variant="text" width="50%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
