// app/archive/[week]/page.tsx
// Detailed view of a single archived contest showing all artworks and final results.
// This is a Server Component that fetches a specific contest by week number.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Image from 'next/image'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

type PageProps = {
  params: {
    week: string
  }
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const weekNumber = parseInt(params.week)

  if (isNaN(weekNumber)) {
    return {
      title: 'Contest Not Found | AI Art Arena',
    }
  }

  const supabase = await createClient()
  const { data } = await supabase.rpc('get_contest_by_week', {
    p_week_number: weekNumber,
  })

  if (!data || data.length === 0) {
    return {
      title: 'Contest Not Found | AI Art Arena',
    }
  }

  const contest = data[0]
  const artworkImages = data
    .filter(row => row.artwork_image_url)
    .map(row => row.artwork_image_url)

  return {
    title: `${contest.contest_title} - Week ${weekNumber} | AI Art Arena`,
    description:
      contest.contest_description ||
      `View results from Week ${weekNumber} of AI Art Arena`,
    openGraph: {
      title: contest.contest_title,
      description: contest.contest_description || `Week ${weekNumber} results`,
      images: artworkImages.slice(0, 6),
    },
  }
}

export default async function ArchiveDetailPage({ params }: PageProps) {
  // Parse week number from URL
  const weekNumber = parseInt(params.week)

  // Validate week number
  if (isNaN(weekNumber) || weekNumber < 1) {
    notFound()
  }

  const supabase = await createClient()

  // Fetch the contest by week number
  const { data, error } = await supabase.rpc('get_contest_by_week', {
    p_week_number: weekNumber,
  })

  if (error || !data || data.length === 0) {
    notFound()
  }

  // Transform the data
  const firstRow = data[0]
  const contestInfo = {
    id: firstRow.contest_id,
    weekNumber: firstRow.contest_week_number,
    title: firstRow.contest_title,
    description: firstRow.contest_description,
    startDate: firstRow.contest_start_date,
    endDate: firstRow.contest_end_date,
    status: firstRow.contest_status,
  }

  // Get all artworks sorted by vote count (winner first)
  const artworks = data
    .filter(row => row.artwork_id !== null)
    .map(row => ({
      id: row.artwork_id,
      imageUrl: row.artwork_image_url,
      title: row.artwork_title,
      prompt: row.artwork_prompt,
      voteCount: row.artwork_vote_count,
      displayOrder: row.artwork_display_order,
    }))
    .sort((a, b) => b.voteCount - a.voteCount) // Sort by votes descending

  const winner = artworks[0]
  const totalVotes = artworks.reduce(
    (sum, artwork) => sum + artwork.voteCount,
    0
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <Link href="/archive">
            <Button variant="ghost" size="sm">
              ← Back to Archive
            </Button>
          </Link>
        </div>

        {/* Contest Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1 mb-4 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
            Week {contestInfo.weekNumber}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {contestInfo.title}
          </h1>
          {contestInfo.description && (
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              {contestInfo.description}
            </p>
          )}

          {/* Contest Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div>
              <span className="font-semibold text-gray-900">{totalVotes}</span>{' '}
              total votes
            </div>
            <div>
              <span className="font-semibold text-gray-900">
                {artworks.length}
              </span>{' '}
              artworks
            </div>
            <div>
              Ended{' '}
              {new Date(contestInfo.endDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Winner Spotlight */}
        {winner && (
          <div className="mb-16">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                🏆 Winner
              </h2>
              <p className="text-gray-600">
                The artwork that captured the community&apos;s vote
              </p>
            </div>

            <Card className="max-w-4xl mx-auto overflow-hidden">
              <div className="md:flex">
                {/* Winner Image */}
                <div className="md:w-1/2 relative aspect-square bg-gray-100">
                  <Image
                    src={winner.imageUrl}
                    alt={winner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                </div>

                {/* Winner Info */}
                <div className="md:w-1/2 p-8 flex flex-col justify-center">
                  <div className="inline-block px-3 py-1 mb-4 text-sm font-semibold text-yellow-700 bg-yellow-100 rounded-full w-fit">
                    1st Place
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">
                    {winner.title}
                  </h3>
                  {winner.prompt && (
                    <p className="text-gray-600 mb-6 italic">
                      &ldquo;{winner.prompt}&rdquo;
                    </p>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <span className="text-gray-700 font-medium">
                        Total Votes
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {winner.voteCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <span className="text-gray-700 font-medium">
                        Vote Share
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {totalVotes > 0
                          ? Math.round((winner.voteCount / totalVotes) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* All Artworks - Ranked by Votes */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Final Rankings
            </h2>
            <p className="text-gray-600">
              All artworks from this contest, ranked by community votes
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {artworks.map((artwork, index) => (
              <Card key={artwork.id} className="overflow-hidden">
                {/* Ranking Badge */}
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <div
                      className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg
                      ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-orange-600'
                          : 'bg-gray-300'
                      }
                    `}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* Artwork Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={artwork.imageUrl}
                      alt={artwork.title}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Artwork Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                    {artwork.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {artwork.voteCount} votes
                    </span>
                    <span className="text-gray-500">
                      {totalVotes > 0
                        ? Math.round((artwork.voteCount / totalVotes) * 100)
                        : 0}
                      %
                    </span>
                  </div>

                  {/* Vote Progress Bar */}
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-orange-600'
                          : 'bg-blue-400'
                      }`}
                      style={{
                        width: `${
                          totalVotes > 0
                            ? (artwork.voteCount / totalVotes) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="mt-16 text-center">
          <Link href="/archive">
            <Button variant="secondary" size="lg">
              View More Past Contests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Static generation for archived contests
export const revalidate = 86400 // Revalidate once per day (archives don't change)
