// app/archive/[week]/loading.tsx
// Loading state for archive detail page

import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

export default function ArchiveDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Back button skeleton */}
        <div className="mb-8">
          <Skeleton variant="rectangular" width="120px" height="36px" />
        </div>

        {/* Header skeleton */}
        <div className="text-center mb-12 space-y-4">
          <Skeleton
            variant="text"
            width="100px"
            height="24px"
            className="mx-auto"
          />
          <Skeleton
            variant="text"
            width="400px"
            height="40px"
            className="mx-auto"
          />
          <Skeleton
            variant="text"
            width="600px"
            height="20px"
            className="mx-auto"
          />
        </div>

        {/* Winner spotlight skeleton */}
        <Card className="max-w-4xl mx-auto overflow-hidden mb-16">
          <div className="md:flex">
            <Skeleton variant="rectangular" width="50%" height="400px" />
            <div className="md:w-1/2 p-8 space-y-4">
              <Skeleton variant="text" width="100px" height="24px" />
              <Skeleton variant="text" width="100%" height="32px" />
              <Skeleton variant="text" width="90%" height="16px" />
              <Skeleton variant="rectangular" width="100%" height="60px" />
              <Skeleton variant="rectangular" width="100%" height="60px" />
            </div>
          </div>
        </Card>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton variant="rectangular" width="100%" height="300px" />
              <div className="p-4 space-y-3">
                <Skeleton variant="text" width="80%" height="20px" />
                <div className="flex justify-between">
                  <Skeleton variant="text" width="60px" height="16px" />
                  <Skeleton variant="text" width="40px" height="16px" />
                </div>
                <Skeleton variant="rectangular" width="100%" height="8px" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
