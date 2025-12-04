// app/archive/loading.tsx
// Loading state for the archive list page

import { Skeleton } from '@/components/ui/Skeleton'
import { Card } from '@/components/ui/Card'

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <Skeleton
            variant="text"
            width="300px"
            height="40px"
            className="mx-auto mb-4"
          />
          <Skeleton
            variant="text"
            width="500px"
            height="20px"
            className="mx-auto"
          />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton variant="rectangular" width="100%" height="200px" />
              <div className="p-6 space-y-3">
                <Skeleton variant="text" width="80px" height="20px" />
                <Skeleton variant="text" width="100%" height="24px" />
                <Skeleton variant="text" width="90%" height="16px" />
                <Skeleton variant="rectangular" width="100%" height="60px" />
                <div className="flex justify-between pt-4">
                  <Skeleton variant="text" width="80px" height="14px" />
                  <Skeleton variant="text" width="80px" height="14px" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
