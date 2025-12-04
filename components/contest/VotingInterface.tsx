// components/contest/VotingInterface.tsx
// The interactive voting interface where users click on artworks to cast votes.
// This is a Client Component because it handles user interactions and manages state.

'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

// Define the structure of an artwork object
// This type ensures we pass the correct data shape to this component
type Artwork = {
  id: string
  imageUrl: string
  title: string
  prompt: string | null
  voteCount: number
  displayOrder: number
}

type VotingInterfaceProps = {
  artworks: Artwork[]
  contestId: string
}

/**
 * VotingInterface displays artworks and handles vote submission.
 *
 * This component demonstrates several important patterns:
 *
 * 1. Optimistic Updates: When a user votes, we immediately update the UI
 *    before the server confirms the action. This makes the app feel instant.
 *    If the server request fails, we roll back the optimistic update.
 *
 * 2. Error Handling: We use try-catch to gracefully handle failures and
 *    provide clear feedback to users about what went wrong.
 *
 * 3. Loading States: We track whether a vote is in progress and disable
 *    interaction during that time to prevent double-voting.
 *
 * 4. Responsive Design: The grid adapts from 2 columns on mobile to 3 on
 *    desktop, ensuring the interface works well on all screen sizes.
 */
export function VotingInterface({ artworks, contestId }: VotingInterfaceProps) {
  // Track which artwork the user voted for (null means no vote yet)
  // We store the artwork ID rather than a boolean because we need to know
  // which specific artwork was selected for the optimistic update
  const [votedForId, setVotedForId] = useState<string | null>(null)

  // Track the current vote counts for each artwork
  // We initialize this from the props but maintain our own state so we can
  // update it optimistically when someone votes
  const [artworkVotes, setArtworkVotes] = useState<Record<string, number>>(
    artworks.reduce(
      (acc, artwork) => ({
        ...acc,
        [artwork.id]: artwork.voteCount,
      }),
      {}
    )
  )

  // useTransition is a React hook that lets us mark state updates as transitions
  // This means React can interrupt them if something more urgent happens
  // The isPending flag tells us if the transition is in progress
  const [isPending, startTransition] = useTransition()

  // This function handles voting on an artwork
  // It uses async/await because it makes an API call
  async function handleVote(artworkId: string) {
    // Prevent voting if already voted or if a vote is in progress
    // This prevents double-voting and concurrent vote attempts
    if (votedForId || isPending) {
      return
    }

    // Show a loading toast while the vote is being submitted
    // The toast library (sonner) gives us clean notification UI
    const loadingToast = toast.loading('Submitting your vote...')

    // Store the current vote count so we can roll back if needed
    const previousVoteCount = artworkVotes[artworkId]

    // OPTIMISTIC UPDATE: Immediately update the UI as if the vote succeeded
    // This makes the app feel instant and responsive
    setVotedForId(artworkId)
    setArtworkVotes(prev => ({
      ...prev,
      [artworkId]: prev[artworkId] + 1,
    }))

    // Wrap the API call in startTransition so React knows this is a
    // non-urgent update that can be interrupted
    startTransition(async () => {
      try {
        // Make the API call to submit the vote
        // We send the artwork ID and contest ID so the server knows what to record
        const response = await fetch('/api/vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            artwork_id: artworkId,
            contest_id: contestId,
          }),
        })

        // Parse the JSON response from the server
        const data = await response.json()

        // Dismiss the loading toast since we have a response
        toast.dismiss(loadingToast)

        // Check if the request was successful
        if (!response.ok) {
          // The request failed - roll back the optimistic update
          setVotedForId(null)
          setArtworkVotes(prev => ({
            ...prev,
            [artworkId]: previousVoteCount,
          }))

          // Show an error message to the user
          // Use the error message from the server if available
          toast.error(data.error || 'Failed to submit vote. Please try again.')
          return
        }

        // Success! Show a confirmation message
        toast.success('Vote submitted successfully!')

        // Update the vote count with the actual count from the server
        // This ensures we stay in sync with the database even if multiple
        // people voted at the same time
        if (data.voteCount !== undefined) {
          setArtworkVotes(prev => ({
            ...prev,
            [artworkId]: data.voteCount,
          }))
        }
      } catch (error) {
        // Network error or other unexpected failure
        // Roll back the optimistic update
        setVotedForId(null)
        setArtworkVotes(prev => ({
          ...prev,
          [artworkId]: previousVoteCount,
        }))

        // Dismiss loading toast and show error
        toast.dismiss(loadingToast)
        toast.error(
          'Network error. Please check your connection and try again.'
        )

        // Log the error for debugging
        console.error('Vote submission error:', error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Grid of artworks - responsive columns based on screen size */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {artworks
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(artwork => {
            // Determine if this artwork is the one the user voted for
            const isSelected = votedForId === artwork.id

            // Determine if voting is disabled (already voted or vote in progress)
            const isDisabled = votedForId !== null || isPending

            return (
              <div
                key={artwork.id}
                className={`
                  group relative cursor-pointer transition-all duration-200
                  ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2' : ''}
                  ${
                    isDisabled && !isSelected
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }
                `}
                onClick={() => !isDisabled && handleVote(artwork.id)}
              >
                {/* Artwork image with Next.js Image optimization */}
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    priority={artwork.displayOrder < 2}
                  />

                  {/* Hover overlay with vote button */}
                  {!isDisabled && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button
                        className="bg-white text-gray-900 px-6 py-3 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
                        onClick={e => {
                          e.stopPropagation()
                          handleVote(artwork.id)
                        }}
                      >
                        Vote
                      </button>
                    </div>
                  )}

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="bg-blue-500 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-lg">
                        ✓ Voted
                      </div>
                    </div>
                  )}
                </div>

                {/* Artwork information below the image */}
                <div className="mt-3 space-y-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">
                    {artwork.title}
                  </h3>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {artworkVotes[artwork.id] || 0} votes
                    </span>

                    {/* Display order badge for testing/debugging */}
                    {process.env.NODE_ENV === 'development' && (
                      <span className="text-xs text-gray-400">
                        #{artwork.displayOrder + 1}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Information message after voting */}
      {votedForId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-900 font-medium">
            Thank you for voting! Check back at the end of the week to see the
            results.
          </p>
        </div>
      )}
    </div>
  )
}
