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
type PageProps = {
  params: {
    id: string
  }
}

// The generateMetadata function runs before the page renders and creates
// the SEO metadata for this page. This is important because it makes your
// contest pages show up correctly when shared on social media and in search
// engine results. The function is async because it needs to fetch the contest
// data to create accurate metadata.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = await createClient()

  // Fetch the contest data to use in the metadata
  // We use the database function we created earlier
  const { data } = await supabase.rpc('get_active_contest')

  // If there is no data, return basic metadata
  if (!data || data.length === 0) {
    return {
      title: 'Contest Not Found | AI Art Arena',
      description: 'This contest could not be found.',
    }
  }

  // Extract contest info from the first row since all rows have the same contest data
  const contest = data[0]

  // Collect all artwork image URLs for Open Graph images
  // Open Graph is what Facebook, Twitter, and other platforms use
  // to show preview images when someone shares your link
  const artworkImages = data
    .filter(row => row.artwork_image_url)
    .map(row => row.artwork_image_url)

  return {
    title: `${contest.contest_title} | AI Art Arena`,
    description:
      contest.contest_description ||
      `Vote on Week ${contest.contest_week_number}'s AI-generated artwork competition`,
    openGraph: {
      title: contest.contest_title,
      description:
        contest.contest_description || `Vote on stunning AI-generated artwork`,
      images: artworkImages.slice(0, 6), // Include up to 6 preview images
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: contest.contest_title,
      description:
        contest.contest_description ||
        `Vote on Week ${contest.contest_week_number}`,
      images: artworkImages.slice(0, 1), // Twitter uses just the first image
    },
  }
}

// The main page component. This is an async Server Component, which means
// it can directly await database calls and other async operations. The HTML
// it generates includes all the data, so the page loads with content already
// visible rather than showing a loading spinner.
export default async function ContestPage({ params }: PageProps) {
  const supabase = await createClient()

  // Fetch the active contest with all its artworks using the database function
  // This single query gets everything we need for the page
  const { data, error } = await supabase.rpc('get_active_contest')

  // Handle the case where the query fails or returns no data
  // notFound() is a Next.js function that shows the 404 page
  if (error || !data || data.length === 0) {
    notFound()
  }

  // The database function returns multiple rows (one per artwork) but they all
  // have the same contest data. So we can extract the contest info from the
  // first row and then map the rows to extract just the artwork data.
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

  // Transform the database rows into a cleaner artwork array
  // We filter out any rows where artwork_id is null, which would indicate
  // a contest with no artworks (shouldn't happen but good to be defensive)
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

  // Check if the current user has already voted on this contest
  // We need both the user's ID (if authenticated) and their IP hash (if anonymous)
  // For now, we will pass null for both and implement this check in the API route
  // The voting interface will handle showing the appropriate UI based on vote status

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
          title={contestInfo.title}
          description={contestInfo.description}
          weekNumber={contestInfo.weekNumber}
          endDate={contestInfo.endDate}
        />

        {/* Voting interface handles the interactive voting behavior */}
        {/* This is a Client Component because it needs onClick handlers and state */}
        <VotingInterface artworks={artworks} contestId={contestInfo.id} />
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
  