// components/admin/ArchiveContestButton.tsx
'use client'
// CLIENT COMPONENT - needs confirmation dialog + loading state
// Calls PATCH /api/admin/contests to set status = 'archived'.
// Refreshes the page after success so the list updates.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ArchiveContestButtonProps {
  contestId: string
  weekNumber: number
}

export function ArchiveContestButton({
  contestId,
  weekNumber,
}: ArchiveContestButtonProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleArchive() {
    setIsPending(true)
    try {
      const res = await fetch('/api/admin/contests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contestId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to archive contest')
        return
      }

      toast.success(`Week ${weekNumber} archived`)
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsPending(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Archive Week {weekNumber}?</span>
        <button
          onClick={handleArchive}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white transition-colors"
        >
          {isPending ? 'Archiving...' : 'Confirm'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
    >
      Archive
    </button>
  )
}
