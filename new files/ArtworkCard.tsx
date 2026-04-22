// components/contest/ArtworkCard.tsx
// SERVER COMPONENT - no 'use client'
// Renders a single artwork image + metadata
// VoteButton is injected as a child prop to keep this component server-side

import Image from 'next/image'
import { Artwork } from '@/lib/types'

interface ArtworkCardProps {
  artwork: Artwork
  index: number
  voteButton: React.ReactNode   // Client VoteButton injected from parent
  isVotedFor: boolean
  totalContestVotes: number
}

function VoteBar({
  voteCount,
  totalVotes,
}: {
  voteCount: number
  totalVotes: number
}) {
  const percentage =
    totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">
          {voteCount.toLocaleString()} {voteCount === 1 ? 'vote' : 'votes'}
        </span>
        <span className="text-xs font-medium text-purple-400">
          {percentage}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function ArtworkCard({
  artwork,
  index,
  voteButton,
  isVotedFor,
  totalContestVotes,
}: ArtworkCardProps) {
  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl overflow-hidden
        bg-gray-900 border transition-all duration-300
        ${
          isVotedFor
            ? 'border-purple-500 shadow-lg shadow-purple-500/20'
            : 'border-gray-800 hover:border-gray-700'
        }
      `}
    >
      {/* Voted indicator ribbon */}
      {isVotedFor && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Your Vote
        </div>
      )}

      {/* Artwork image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-950">
        <Image
          src={artwork.image_url}
          alt={artwork.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index < 2}   // LCP optimization: eager-load first 2 images
          quality={85}
        />

        {/* Subtle gradient overlay at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900/80 to-transparent" />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-semibold text-white text-sm leading-snug mb-1 line-clamp-2">
          {artwork.title}
        </h3>

        {/* Prompt snippet if available */}
        {artwork.artist_prompt && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3">
            {artwork.artist_prompt}
          </p>
        )}

        {/* Vote bar */}
        <VoteBar
          voteCount={artwork.vote_count}
          totalVotes={totalContestVotes}
        />

        {/* Vote button - injected as client component */}
        <div className="mt-4">{voteButton}</div>
      </div>
    </div>
  )
}
