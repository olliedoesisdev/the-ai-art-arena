// components/contest/ArtworkCard.tsx
// SERVER COMPONENT — no interactivity.
// Renders a single artwork image + vote bar + injected vote button.
// VoteButton is passed as a React node from VotingInterface so this
// component stays server-renderable.

import Image from 'next/image'

interface ArtworkCardProps {
  id: string
  title: string
  imageUrl: string
  prompt: string | null
  voteCount: number
  totalVotes: number
  index: number
  isVotedFor: boolean
  voteButton: React.ReactNode
}

function VoteBar({
  voteCount,
  totalVotes,
}: {
  voteCount: number
  totalVotes: number
}) {
  const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
  // Use at least 2% bar width when there are votes so the bar is always visible
  const barWidth = voteCount > 0 && totalVotes > 0 ? Math.max(2, pct) : 0
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">
          {voteCount.toLocaleString()} {voteCount === 1 ? 'vote' : 'votes'}
        </span>
        <span className="text-xs font-medium text-blue-600">{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-700"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

export function ArtworkCard({
  title,
  imageUrl,
  prompt,
  voteCount,
  totalVotes,
  index,
  isVotedFor,
  voteButton,
}: ArtworkCardProps) {
  return (
    <div
      className={`
        group relative flex flex-col rounded-xl overflow-hidden
        bg-white border transition-all duration-200
        ${isVotedFor
          ? 'border-blue-400 shadow-md shadow-blue-100'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
      `}
    >
      {/* Voted ribbon */}
      {isVotedFor && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Your Vote
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={index < 2}
          quality={85}
        />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">
          {title}
        </h3>

        {prompt && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{prompt}</p>
        )}

        <VoteBar voteCount={voteCount} totalVotes={totalVotes} />

        <div className="mt-4">{voteButton}</div>
      </div>
    </div>
  )
}
