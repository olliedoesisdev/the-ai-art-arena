// app/contest/[id]/page.tsx
// This is the main contest page where users view artworks and vote.
// It is a Server Component that fetches data on the server and passes it
// to Client Components for interactive behavior.

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { VotingInterface } from '@/components/contest/VotingInterface'
import { ContestHeader } from '@/components/contest/ContestHeader'

// This type defines the structure of the params object that Next.js passes
// to dynamic route pages. The [id] in the folder name becomes params.id
// In Next.js 15+, params is a Promise and must be awaited
type PageProps = {
  params: Promise<{
    id: string
  }>
}

// The generateMetadata function runs before the page renders and creates
// the SEO metadata for this page. This is important because it makes your
// contest pages show up correctly when shared on social media and in search
// engine results. The function is async because it needs to fetch the contest
// data to create accurate metadata.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  // In Next.js 15+, params is a Promise and must be awaited
  const { id } = await params

  const supabase = await createClient()

  // Fetch the contest data to use in the metadata
  // Using a direct query instead of the database function for reliability
  const { data: contest } = await supabase
    .from('contests')
    .select(
      `
      title,
      description,
      week_number,
      artworks (
        image_url
      )
    `
    )
    .eq('id', id)
    .single()

  // If there is no data, return basic metadata
  if (!contest) {
    return {
      title: 'Contest Not Found | AI Art Arena',
      description: 'This contest could not be found.',
    }
  }

  // Collect all artwork image URLs for Open Graph images
  // Open Graph is what Facebook, Twitter, and other platforms use
  // to show preview images when someone shares your link
  const artworkImages = contest.artworks
    .map(artwork => artwork.image_url)
    .filter(Boolean)

  return {
    title: `${contest.title} | AI Art Arena`,
    description:
      contest.description ||
      `Vote on Week ${contest.week_number}'s AI-generated artwork competition`,
    openGraph: {
      title: contest.title,
      description:
        contest.description || `Vote on stunning AI-generated artwork`,
      images: artworkImages.slice(0, 6), // Include up to 6 preview images
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: contest.title,
      description: contest.description || `Vote on Week ${contest.week_number}`,
      images: artworkImages.slice(0, 1), // Twitter uses just the first image
    },
  }
}

// The main page component. This is an async Server Component, which means
// it can directly await database calls and other async operations. The HTML
// it generates includes all the data, so the page loads with content already
// visible rather than showing a loading spinner.
export default async function ContestPage({ params }: PageProps) {
  // In Next.js 15+, params is a Promise and must be awaited
  const { id } = await params

  const supabase = await createClient()

  // Fetch the contest with all its artworks
  // Using a direct query with Supabase's relation syntax is more reliable
  // than a custom database function and easier to debug
  const { data: contest, error } = await supabase
    .from('contests')
    .select(
      `
      id,
      week_number,
      title,
      description,
      start_date,
      end_date,
      status,
      artworks (
        id,
        title,
        image_url,
        prompt,
        vote_count,
        display_order
      )
    `
    )
    .eq('id', id)
    .single()

  // Handle the case where the query fails or returns no data
  // notFound() is a Next.js function that shows the 404 page
  if (error || !contest) {
    console.error('Contest fetch error:', error)
    notFound()
  }

  // Check if contest is active
  // If not active, show a message instead of the voting interface
  if (contest.status !== 'active') {
    const isArchived = contest.status === 'archived'

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{isArchived ? '🏁' : '⏳'}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isArchived ? 'Contest Ended' : 'Contest Not Active'}
          </h1>
          <p className="text-gray-600 mb-6">
            {isArchived
              ? 'This contest has ended. Check out the archive to see the winner!'
              : 'This contest is not yet open for voting. Check back soon!'}
          </p>
          {isArchived && (
            <a
              href={`/archive/${contest.week_number}`}
              className="text-blue-600 hover:underline font-medium"
            >
              View Results →
            </a>
          )}
          <div className="mt-4">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Sort artworks by display_order to ensure consistent display
  const sortedArtworks = [...contest.artworks].sort(
    (a, b) => a.display_order - b.display_order
  )

  // Transform the artworks into the format the VotingInterface expects
  // Using camelCase for consistency with React/TypeScript conventions
  const artworks = sortedArtworks.map(artwork => ({
    id: artwork.id,
    imageUrl: artwork.image_url,
    title: artwork.title,
    prompt: artwork.prompt,
    voteCount: artwork.vote_count || 0,
    displayOrder: artwork.display_order,
  }))

  // Render the page structure
  // Notice how we separate concerns: the Server Component handles data fetching
  // and passes that data as props to specialized components that handle rendering
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Container with max width and padding */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Contest header shows title, description, and time remaining */}
        {/* This is a Server Component because it does not need interactivity */}
        <ContestHeader
          title={contest.title}
          description={contest.description}
          weekNumber={contest.week_number}
          endDate={contest.end_date}
        />

        {/* Voting interface handles the interactive voting behavior */}
        {/* This is a Client Component because it needs onClick handlers and state */}
        <VotingInterface artworks={artworks} contestId={contest.id} />
      </div>
    </div>
  )
}

// This tells Next.js to regenerate this page every 60 seconds
// This is called Incremental Static Regeneration (ISR)
// It means the page is generated as a static HTML file, but Next.js will
// regenerate it in the background every 60 seconds to pick up new vote counts
// This gives you the performance of static pages with the freshness of dynamic pages
export const revalidate = 60
