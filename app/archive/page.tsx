// app/archive/page.tsx
// Archive listing page showing all past contests.
// This is a Server Component that fetches all archived contests.

import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contest Archive | AI Art Arena',
  description: 'Browse past AI Art Arena contests and see which artworks won.',
  openGraph: {
    title: 'Contest Archive | AI Art Arena',
    description:
      'Browse past AI Art Arena contests and see which artworks won.',
  },
}

export default async function ArchivePage() {
  const supabase = await createClient()

  // Fetch all archived contests using the database function we created
  const { data: archivedContests } = await supabase.rpc('get_archived_contests')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Contest Archive
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse past contests and discover which artworks captured the
            community&apos;s imagination
          </p>
        </div>

        {/* Archive Grid */}
        {archivedContests && archivedContests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedContests.map(contest => (
              <Link
                key={contest.contest_id}
                href={`/archive/${contest.contest_week_number}`}
              >
                <Card hoverable className="overflow-hidden h-full">
                  {/* Winner Image Preview */}
                  {contest.winner_artwork_image_url && (
                    <div className="relative aspect-video overflow-hidden bg-gray-100">
                      <Image
                        src={contest.winner_artwork_image_url}
                        alt={contest.winner_artwork_title || 'Winning artwork'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />

                      {/* Winner Badge */}
                      <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg flex items-center gap-1">
                        <span>🏆</span>
                        <span>Winner</span>
                      </div>
                    </div>
                  )}

                  {/* Contest Info */}
                  <div className="p-6">
                    {/* Week Badge */}
                    <div className="inline-block px-3 py-1 mb-3 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                      Week {contest.contest_week_number}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {contest.contest_title}
                    </h3>

                    {/* Description */}
                    {contest.contest_description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {contest.contest_description}
                      </p>
                    )}

                    {/* Winner Info */}
                    {contest.winner_artwork_title && (
                      <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="text-xs text-yellow-800 font-semibold mb-1">
                          Winning Artwork
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {contest.winner_artwork_title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {contest.winner_vote_count} votes
                        </div>
                      </div>
                    )}

                    {/* Statistics */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <span>{contest.total_votes || 0} total votes</span>
                      <span>{contest.artwork_count || 0} artworks</span>
                    </div>

                    {/* Date */}
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(contest.contest_end_date).toLocaleDateString(
                        'en-US',
                        {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Archived Contests Yet
            </h2>
            <p className="text-gray-600">
              Contests will appear here after they end. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Revalidate every hour since archived contests don't change often
export const revalidate = 3600
