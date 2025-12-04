// components/contest/ContestTimer.tsx
// A countdown timer that shows how much time remains until voting closes.
// This must be a Client Component because it uses useEffect and useState
// to update the display every second.

'use client'

import { useEffect, useState } from 'react'

type ContestTimerProps = {
  endDate: string
}

/**
 * Countdown timer showing time remaining until contest ends.
 *
 * This component demonstrates several important patterns:
 * 1. The 'use client' directive makes it a Client Component
 * 2. useEffect sets up an interval to update the timer
 * 3. The cleanup function clears the interval when component unmounts
 * 4. Time calculations handle days, hours, minutes, and seconds
 * 5. Graceful handling of contests that have already ended
 */
export function ContestTimer({ endDate }: ContestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [hasEnded, setHasEnded] = useState(false)

  useEffect(() => {
    // Function to calculate and format the time remaining
    function calculateTimeLeft() {
      // Calculate the difference between now and the end date
      const difference = new Date(endDate).getTime() - Date.now()

      // If the contest has ended, update state and stop
      if (difference <= 0) {
        setHasEnded(true)
        setTimeLeft('Voting has ended')
        return
      }

      // Calculate time components
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / (1000 * 60)) % 60)
      const seconds = Math.floor((difference / 1000) % 60)

      // Format the display based on how much time is left
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s remaining`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s remaining`)
      } else {
        setTimeLeft(`${seconds}s remaining`)
      }
    }

    // Calculate immediately on mount
    calculateTimeLeft()

    // Set up interval to update every second
    // Only run the interval if the contest has not ended
    const interval = setInterval(calculateTimeLeft, 1000)

    // Cleanup function that runs when component unmounts
    // This prevents memory leaks from intervals continuing after unmount
    return () => clearInterval(interval)
  }, [endDate]) // Re-run if endDate changes

  return (
    <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm border border-gray-200">
      {/* Clock icon */}
      <svg
        className={`w-5 h-5 ${hasEnded ? 'text-gray-400' : 'text-blue-600'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Time display */}
      <span
        className={`font-mono text-sm font-medium ${
          hasEnded ? 'text-gray-500' : 'text-gray-900'
        }`}
      >
        {timeLeft || 'Calculating...'}
      </span>
    </div>
  )
}
