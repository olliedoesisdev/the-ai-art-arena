// app/page.tsx
// The homepage - the first page users see when they visit AI Art Arena.
// This is a Server Component that fetches and displays the active contest.

import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch the active contest
  const { data: contestData } = await supabase.rpc('get_active_contest')

  // Fetch some statistics for social proof
  const { count: totalVotes } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })

  const { count: totalContests } = await supabase
    .from('contests')
    .select('*', { count: 'exact', head: true })

  // Transform contest data if it exists
  let activeContest = null
  if (contestData && contestData.length > 0) {
    const firstRow = contestData[0]
    activeContest = {
      id: firstRow.contest_id,
      weekNumber: firstRow.contest_week_number,
      title: firstRow.contest_title,
      description: firstRow.contest_description,
      // Get the first 3 artworks for preview
      artworks: contestData
        .filter(row => row.artwork_id !== null)
        .slice(0, 3)
        .map(row => ({
          id: row.artwork_id,
          imageUrl: row.artwork_image_url,
          title: row.artwork_title,
        })),
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-16">
          {/* Logo/Title */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6">
            AI Art Arena
          </h1>

          {/* Tagline */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Vote on stunning AI-generated artwork every week. Discover
            creativity at the intersection of art and technology.
          </p>

          {/* CTA Buttons */}
          {activeContest ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/contest/${activeContest.id}`}>
                <Button size="lg" variant="primary">
                  Vote on Week {activeContest.weekNumber}
                </Button>
              </Link>
              <Link href="/archive">
                <Button size="lg" variant="secondary">
                  View Past Contests
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 text-lg">
              No active contest right now. Check back soon!
            </p>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          <Card className="text-center p-8">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {totalVotes || 0}
            </div>
            <div className="text-gray-600">Total Votes Cast</div>
          </Card>

          <Card className="text-center p-8">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {totalContests || 0}
            </div>
            <div className="text-gray-600">Contests Held</div>
          </Card>

          <Card className="text-center p-8">
            <div className="text-4xl font-bold text-pink-600 mb-2">6</div>
            <div className="text-gray-600">Artworks per Week</div>
          </Card>
        </div>

        {/* Active Contest Preview */}
        {activeContest && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              This Week&apos;s Contest
            </h2>

            <Card className="p-8" hoverable>
              <Link href={`/contest/${activeContest.id}`}>
                <div className="space-y-6">
                  {/* Contest Title */}
                  <div className="text-center">
                    <div className="inline-block px-4 py-1 mb-3 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full">
                      Week {activeContest.weekNumber}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {activeContest.title}
                    </h3>
                    {activeContest.description && (
                      <p className="text-gray-600">
                        {activeContest.description}
                      </p>
                    )}
                  </div>

                  {/* Preview Images */}
                  <div className="grid grid-cols-3 gap-4">
                    {activeContest.artworks.map(artwork => (
                      <div
                        key={artwork.id}
                        className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                      >
                        <Image
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          fill
                          sizes="(max-width: 768px) 33vw, 25vw"
                          className="object-cover transition-transform duration-200 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="text-center">
                    <Button variant="primary" size="lg">
                      View All Artworks & Vote
                    </Button>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. Browse Artworks
              </h3>
              <p className="text-gray-600">
                Each week features 6 unique AI-generated artworks created with
                cutting-edge technology.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🗳️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. Cast Your Vote
              </h3>
              <p className="text-gray-600">
                Click on your favorite artwork to vote. One vote per contest,
                updated in real-time.
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. See Results
              </h3>
              <p className="text-gray-600">
                At the end of the week, the contest closes and the winner is
                displayed in the archive.
              </p>
            </Card>
          </div>
        </div>

        {/* Footer CTA */}
        {activeContest && (
          <div className="text-center">
            <Link href={`/contest/${activeContest.id}`}>
              <Button size="lg" variant="primary">
                Start Voting Now
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Enable ISR - regenerate every 5 minutes to pick up new contests
export const revalidate = 300
