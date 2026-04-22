'use client'
// CLIENT COMPONENT — owns all voting state and network logic.
// Renders ArtworkCard (server-compatible) with VoteButton injected as a child
// so the card itself stays free of client-only code.

import { useState, useTransition, useCallback } from 'react'
import { toast } from 'sonner'
import { ArtworkCard } from './ArtworkCard'
import { VoteButton } from './VoteButton'
import type { VotingArtwork } from '@/lib/types'

type VotingInterfaceProps = {
  artworks: VotingArtwork[]
  contestId: string
}

export function VotingInterface({ artworks: initialArtworks, contestId }: VotingInterfaceProps) {
  const [votedForId, setVotedForId] = useState<string | null>(null)
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(initialArtworks.map(a => [a.id, a.voteCount]))
  )
  const [isPending, startTransition] = useTransition()

  const totalVotes = Object.values(voteCounts).reduce((sum, n) => sum + n, 0)

  const handleVote = useCallback(
    (artworkId: string) => {
      if (votedForId || isPending) return

      const previousCount = voteCounts[artworkId]

      // Optimistic update
      setVotedForId(artworkId)
      setVoteCounts(prev => ({ ...prev, [artworkId]: prev[artworkId] + 1 }))

      startTransition(async () => {
        try {
          const res = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artwork_id: artworkId, contest_id: contestId }),
          })

          const data = await res.json()

          if (!res.ok) {
            // Roll back
            setVotedForId(null)
            setVoteCounts(prev => ({ ...prev, [artworkId]: previousCount }))

            if (res.status === 429) {
              toast.error('You have already voted today', {
                description: 'Come back tomorrow to vote again.',
                duration: 5000,
              })
            } else if (res.status === 409) {
              // Already voted server-side — keep optimistic state
              setVotedForId(artworkId)
              toast.info('You already voted in this contest.')
            } else {
              toast.error(data.error || 'Failed to submit vote. Please try again.')
            }
            return
          }

          // Sync server vote count
          if (data.voteCount !== undefined) {
            setVoteCounts(prev => ({ ...prev, [artworkId]: data.voteCount }))
          }

          toast.success('Vote submitted!', {
            description: 'Thanks for participating in AI Art Arena.',
            duration: 4000,
          })
        } catch {
          // Network error — roll back
          setVotedForId(null)
          setVoteCounts(prev => ({ ...prev, [artworkId]: previousCount }))
          toast.error('Network error', { description: 'Check your connection and try again.' })
        }
      })
    },
    [votedForId, isPending, voteCounts, contestId]
  )

  const sorted = [...initialArtworks].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div>
      {/* Pre-vote instruction banner */}
      {!votedForId && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Vote for your favourite artwork — one vote per contest.</span>
        </div>
      )}

      {/* Post-vote confirmation banner */}
      {votedForId && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd" />
          </svg>
          <span>Your vote has been cast! Come back next week to vote again.</span>
        </div>
      )}

      {/* Artwork grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((artwork, index) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            imageUrl={artwork.imageUrl}
            prompt={artwork.prompt}
            voteCount={voteCounts[artwork.id] ?? artwork.voteCount}
            totalVotes={totalVotes}
            index={index}
            isVotedFor={votedForId === artwork.id}
            voteButton={
              <VoteButton
                artworkId={artwork.id}
                isVotedFor={votedForId === artwork.id}
                hasVotedInContest={!!votedForId}
                isPending={isPending && votedForId === artwork.id}
                onVote={handleVote}
              />
            }
          />
        ))}
      </div>

      {initialArtworks.length === 0 && (
        <div className="py-24 text-center text-gray-400">
          <p className="text-lg font-medium">No artworks yet.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}
    </div>
  )
}
