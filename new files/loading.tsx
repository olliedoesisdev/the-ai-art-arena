// app/contest/[id]/loading.tsx
// SERVER COMPONENT - no 'use client'
// Skeleton shown instantly while the contest page fetches data from Supabase
// Matches the layout of the real page so there is no layout shift

function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`bg-gray-800 animate-pulse rounded-lg ${className ?? ''}`}
    />
  )
}

function ArtworkCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gray-900 border border-gray-800">
      {/* Image placeholder */}
      <SkeletonBox className="aspect-square w-full rounded-none" />
      {/* Card body */}
      <div className="p-4 space-y-3">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-full" />
        <SkeletonBox className="h-3 w-2/3" />
        {/* Vote bar */}
        <div className="mt-2">
          <SkeletonBox className="h-1.5 w-full rounded-full" />
        </div>
        {/* Button */}
        <SkeletonBox className="h-10 w-full rounded-xl mt-4" />
      </div>
    </div>
  )
}

export default function ContestLoading() {
  return (
    <main className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header skeleton */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <SkeletonBox className="h-4 w-16" />
            <SkeletonBox className="h-6 w-20 rounded-full" />
          </div>
          <SkeletonBox className="h-10 w-72 mb-4" />
          <div className="flex gap-6">
            <SkeletonBox className="h-4 w-48" />
            <SkeletonBox className="h-4 w-32" />
            <SkeletonBox className="h-4 w-40" />
          </div>
          <div className="mt-6 h-px bg-gray-800" />
        </div>

        {/* Info banner skeleton */}
        <SkeletonBox className="h-14 w-full rounded-xl mb-6" />

        {/* Artwork grid skeleton - 5 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <ArtworkCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  )
}
