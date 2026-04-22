// components/contest/VotingInterface.tsx
'use client'
// CLIENT COMPONENT - owns all voting state and logic
// Receives artworks as props from the server page
// Renders ArtworkCard (server-compatible) with VoteButton injected as children

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { ArtworkCard } from './ArtworkCard'
import { VoteButton } from './VoteButton'
import { VotingInterfaceProps, Artwork, VoteResponse, VoteError } from '@/lib/types'

export function VotingInterface({
  artworks: initialArtworks,
  contestId,
  initialVotedArtworkId = null,
}: VotingInterfaceProps) {
  // Local artwork state so vote counts update instantly (optimistic UI)
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks)
  const [votedArtworkId, setVotedArtworkId] = useState<string | null>(
    initialVotedArtworkId
  )
  const [isPending, startTransition] = useTransition()

  const totalContestVotes = artworks.reduce((sum, a) => sum + a.vote_count, 0)

  const handleVote = useCallback(
    (artworkId: string) => {
      // Guard: already voted or request in flight
      if (votedArtworkId || isPending) return

      // ------------------------------------------
      // OPTIMISTIC UPDATE
      // Show the result immediately before the API responds.
      // If the request fails we roll back.
      // ------------------------------------------
      const previousArtworks = artworks
      const previousVotedId = votedArtworkId

      setVotedArtworkId(artworkId)
      setArtworks((prev) =>
        prev.map((a) =>
          a.id === artworkId ? { ...a, vote_count: a.vote_count + 1 } : a
        )
      )

      startTransition(async () => {
        try {
          const response = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              artwork_id: artworkId,
              contest_id: contestId,
            }),
          })

          const data: VoteResponse | VoteError = await response.json()

          if (!response.ok) {
            // Rollback optimistic update
            setArtworks(previousArtworks)
            setVotedArtworkId(previousVotedId)

            const errorData = data as VoteError
            const message = errorData.error || 'Failed to submit vote'

            // Specific messaging for rate limit (429)
            if (response.status === 429) {
              toast.error('You have already voted today', {
                description: 'Come back tomorrow to vote again!',
                duration: 5000,
              })
            } else if (response.status === 409) {
              // Already voted - sync state to reflect reality
              setVotedArtworkId(artworkId)
              toast.info('You already voted in this contest')
            } else {
              toast.error(message)
            }
            return
          }

          // Success - sync server vote count into local state
          const successData = data as VoteResponse
          setArtworks((prev) =>
            prev.map((a) =>
              a.id === artworkId
                ? { ...a, vote_count: successData.voteCount }
                : a
            )
          )

          toast.success('Vote submitted!', {
            description: 'Thanks for participating in AI Art Arena.',
            duration: 4000,
          })
        } catch (err) {
          // Network error - full rollback
          setArtworks(previousArtworks)
          setVotedArtworkId(previousVotedId)
          toast.error('Network error', {
            description: 'Check your connection and try again.',
          })
        }
      })
    },
    [artworks, contestId, isPending, votedArtworkId]
  )

  return (
    <div>
      {/* Voting instruction banner - only shown when user has not voted yet */}
      {!votedArtworkId && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-300">
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Vote for your favourite artwork. You can vote once per day.
          </span>
        </div>
      )}

      {/* Voted banner */}
      {votedArtworkId && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-300">
          <svg
            className="w-5 h-5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            Your vote has been cast! Come back tomorrow to vote again.
          </span>
        </div>
      )}

      {/* Artwork grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((artwork, index) => (
          <ArtworkCard
            key={artwork.id}
            artwork={artwork}
            index={index}
            isVotedFor={votedArtworkId === artwork.id}
            totalContestVotes={totalContestVotes}
            voteButton={
              <VoteButton
                artworkId={artwork.id}
                isVotedFor={votedArtworkId === artwork.id}
                hasVotedInContest={!!votedArtworkId}
                isPending={isPending && votedArtworkId === artwork.id}
                onVote={handleVote}
              />
            }
          />
        ))}
      </div>

      {/* Empty state - should never happen but defensive */}
      {artworks.length === 0 && (
        <div className="py-24 text-center text-gray-500">
          <p className="text-lg">No artworks in this contest yet.</p>
          <p className="text-sm mt-2">Check back soon!</p>
        </div>
      )}
    </div>
  )
}
