// app/leaderboard/page.tsx
// SERVER COMPONENT
// All-time artwork rankings across every archived contest,
// sorted by vote count descending.

import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leaderboard | AI Art Arena',
  description: 'All-time top artworks ranked by community votes across every AI Art Arena contest.',
}

// Revalidate hourly — archived votes don't change, active contest ticks up
export const revalidate = 3600

type LeaderboardRow = {
  id: string
  title: string
  image_url: string
  prompt: string | null
  vote_count: number
  contest_id: string
  contest_week: number
  contest_title: string
}

const MEDAL: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: '🥇', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  1: { label: '🥈', bg: 'bg-gray-100',   text: 'text-gray-600'  },
  2: { label: '🥉', bg: 'bg-orange-100', text: 'text-orange-700' },
}

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Fetch all artworks from archived contests, joined with contest info
  const { data, error } = await supabase
    .from('artworks')
    .select(`
      id,
      title,
      image_url,
      prompt,
      vote_count,
      contest_id,
      contests!inner (
        week_number,
        title,
        status
      )
    `)
    .eq('contests.status', 'archived')
    .order('vote_count', { ascending: false })
    .limit(50)

  type RawRow = { id: string; title: string; image_url: string; prompt: string | null; vote_count: number; contest_id: string; contests: { week_number: number; title: string; status: string }[] }
  const artworks: LeaderboardRow[] = (data ?? []).map((row: RawRow) => ({
    id: row.id,
    title: row.title,
    image_url: row.image_url,
    prompt: row.prompt,
    vote_count: row.vote_count,
    contest_id: row.contest_id,
    contest_week: row.contests[0].week_number,
    contest_title: row.contests[0].title,
  }))

  const totalVotes = artworks.reduce((sum, a) => sum + a.vote_count, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-5xl mx-auto px-4 py-16">

        {/* Page header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Leaderboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The highest-voted artworks across every AI Art Arena contest.
          </p>
          {artworks.length > 0 && (
            <p className="mt-2 text-sm text-gray-400">
              {totalVotes.toLocaleString()} total votes &middot; {artworks.length} artworks ranked
            </p>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t load the leaderboard right now. Please try again later.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Back to home
            </Link>
          </div>
        )}

        {/* Empty state */}
        {!error && artworks.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No results yet</h2>
            <p className="text-gray-600 mb-6">
              Rankings will appear once the first contest is archived.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Vote in this week&apos;s contest
            </Link>
          </div>
        )}

        {/* Top 3 podium — only shown when no error */}
        {!error && artworks.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            {artworks.slice(0, 3).map((artwork, i) => (
              <Link
                key={artwork.id}
                href={`/archive/${artwork.contest_week}`}
                className="group"
              >
                <Card hoverable className="overflow-hidden text-center">
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={artwork.image_url}
                      alt={artwork.title}
                      fill
                      sizes="(max-width: 768px) 33vw, 25vw"
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      priority={i === 0}
                    />
                  </div>
                  <div className="p-3">
                    <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1 ${MEDAL[i].bg} ${MEDAL[i].text}`}>
                      {MEDAL[i].label} {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{artwork.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{artwork.vote_count.toLocaleString()} votes</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Full ranked list */}
        {artworks.length > 0 && (
          <Card padding="none">
            <ol>
              {artworks.map((artwork, i) => {
                const pct = totalVotes > 0
                  ? Math.round((artwork.vote_count / totalVotes) * 100)
                  : 0

                return (
                  <li key={artwork.id}>
                    <Link
                      href={`/archive/${artwork.contest_week}`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group border-b border-gray-100 last:border-0"
                    >
                      {/* Rank */}
                      <span className={`w-8 text-center text-sm font-bold shrink-0 ${
                        i < 3 ? 'text-lg' : 'text-gray-400'
                      }`}>
                        {i < 3 ? MEDAL[i].label : `#${i + 1}`}
                      </span>

                      {/* Thumbnail */}
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <Image
                          src={artwork.image_url}
                          alt={artwork.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {artwork.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          Week {artwork.contest_week} &middot; {artwork.contest_title}
                        </p>
                        {/* Vote bar */}
                        <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Vote count */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {artwork.vote_count.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{pct}%</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </Card>
        )}

      </div>
    </div>
  )
}
