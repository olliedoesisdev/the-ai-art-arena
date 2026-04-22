// components/contest/VoteButton.tsx
'use client'
// CLIENT COMPONENT - needs onClick handler
// Renders the vote button for a single artwork
// All vote logic lives in VotingInterface - this component only handles visual state

interface VoteButtonProps {
  artworkId: string
  isVotedFor: boolean        // This specific artwork got the vote
  hasVotedInContest: boolean // User voted for any artwork in this contest
  isPending: boolean         // Network request in flight
  onVote: (artworkId: string) => void
}

export function VoteButton({
  artworkId,
  isVotedFor,
  hasVotedInContest,
  isPending,
  onVote,
}: VoteButtonProps) {
  const isDisabled = hasVotedInContest || isPending

  // Already voted for THIS artwork
  if (isVotedFor) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/40 cursor-default select-none"
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Voted
      </button>
    )
  }

  // Voted for a different artwork in this contest
  if (hasVotedInContest) {
    return (
      <button
        disabled
        className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-800/50 border border-gray-800 cursor-not-allowed select-none"
      >
        Already Voted Today
      </button>
    )
  }

  // Loading state while request is in flight
  if (isPending) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-700 text-white cursor-wait"
      >
        <svg
          className="w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Submitting...
      </button>
    )
  }

  // Default: voteable state
  return (
    <button
      onClick={() => onVote(artworkId)}
      disabled={isDisabled}
      className="
        w-full px-4 py-2.5 rounded-xl text-sm font-semibold
        bg-purple-600 hover:bg-purple-500 active:bg-purple-700
        text-white transition-all duration-150
        hover:shadow-lg hover:shadow-purple-500/25
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      Vote for This
    </button>
  )
}
