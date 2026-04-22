// components/contest/ContestTimer.tsx
'use client'
// CLIENT COMPONENT - needs useEffect for the interval tick
// Shows a live countdown to the contest end date.
// Renders as a compact pill in the ContestHeader area.
// When the contest ends mid-session it switches to an "Ended" state
// without requiring a page reload.

import { useState, useEffect } from 'react'

interface ContestTimerProps {
  endDate: string       // ISO date string from the database
  status: 'active' | 'archived' | 'upcoming'
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

function calculateTimeLeft(endDate: string): TimeLeft {
  const diff = new Date(endDate).getTime() - Date.now()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

// Individual time unit block
function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold text-white tabular-nums leading-none">
        {pad(value)}
      </span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
        {label}
      </span>
    </div>
  )
}

// Separator between time blocks
function Separator() {
  return (
    <span className="text-gray-600 font-bold text-lg leading-none pb-3 select-none">
      :
    </span>
  )
}

export function ContestTimer({ endDate, status }: ContestTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(endDate)
  )

  useEffect(() => {
    // No interval needed if contest is already over or not started
    if (status !== 'active') return

    const interval = setInterval(() => {
      const next = calculateTimeLeft(endDate)
      setTimeLeft(next)

      // Stop ticking once expired
      if (next.expired) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [endDate, status])

  // Archived contest - no countdown needed
  if (status === 'archived') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/50">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        <span className="text-xs text-gray-400 font-medium">Contest Ended</span>
      </div>
    )
  }

  // Upcoming contest
  if (status === 'upcoming') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        <span className="text-xs text-blue-300 font-medium">Coming Soon</span>
      </div>
    )
  }

  // Contest expired mid-session
  if (timeLeft.expired) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <span className="text-xs text-red-300 font-medium">
          Voting has closed
        </span>
      </div>
    )
  }

  // Choose urgency colour based on time remaining
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 2
  const containerClass = isUrgent
    ? 'bg-red-500/10 border-red-500/20'
    : 'bg-purple-500/10 border-purple-500/20'
  const dotClass = isUrgent
    ? 'bg-red-400 animate-pulse'
    : 'bg-purple-400 animate-pulse'
  const labelClass = isUrgent ? 'text-red-300' : 'text-purple-300'

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl border ${containerClass}`}
      aria-label={`Voting ends in ${timeLeft.days} days ${timeLeft.hours} hours ${timeLeft.minutes} minutes`}
      role="timer"
    >
      {/* Live indicator dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />

      {/* Label */}
      <span className={`text-xs font-medium ${labelClass} shrink-0`}>
        Ends in
      </span>

      {/* Time blocks - hide days if under 1 day */}
      <div className="flex items-end gap-1">
        {timeLeft.days > 0 && (
          <>
            <TimeBlock value={timeLeft.days} label="d" />
            <Separator />
          </>
        )}
        <TimeBlock value={timeLeft.hours} label="hr" />
        <Separator />
        <TimeBlock value={timeLeft.minutes} label="min" />
        <Separator />
        <TimeBlock value={timeLeft.seconds} label="sec" />
      </div>
    </div>
  )
}
