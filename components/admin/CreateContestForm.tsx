// components/admin/CreateContestForm.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

type ArtworkDraft = {
  id: string
  title: string
  prompt: string
  imageUrl: string
  file: File | null
}

export function CreateContestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Contest metadata
  const [contestData, setContestData] = useState({
    week_number: '',
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'upcoming' as 'active' | 'upcoming' | 'archived',
  })

  // ✅ Dynamic artwork count (2-12)
  const [artworkCount, setArtworkCount] = useState(6)

  // ✅ Initialize with 6 artworks, but allow changing
  const [artworks, setArtworks] = useState<ArtworkDraft[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: String(i + 1),
      title: '',
      prompt: '',
      imageUrl: '',
      file: null,
    }))
  )

  // ✅ Handle changing artwork count
  function handleArtworkCountChange(newCount: number) {
    if (newCount < 2 || newCount > 12) return

    setArtworkCount(newCount)

    if (newCount > artworks.length) {
      // Add more slots
      const newArtworks = [...artworks]
      for (let i = artworks.length; i < newCount; i++) {
        newArtworks.push({
          id: String(i + 1),
          title: '',
          prompt: '',
          imageUrl: '',
          file: null,
        })
      }
      setArtworks(newArtworks)
    } else {
      // Remove excess slots
      setArtworks(artworks.slice(0, newCount))
    }
  }

  // ✅ Handle image file selection
  function handleImageSelect(
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB')
      return
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)

    setArtworks(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], imageUrl: previewUrl, file }
      return updated
    })
  }

  // ✅ Update artwork field
  function updateArtwork(
    index: number,
    field: keyof ArtworkDraft,
    value: string
  ) {
    setArtworks(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // ✅ Validate form
  function validateForm(): string | null {
    if (!contestData.week_number || parseInt(contestData.week_number) < 1) {
      return 'Please enter a valid week number'
    }

    if (!contestData.title.trim()) {
      return 'Please enter a contest title'
    }

    if (!contestData.start_date || !contestData.end_date) {
      return 'Please select start and end dates'
    }

    if (new Date(contestData.start_date) >= new Date(contestData.end_date)) {
      return 'End date must be after start date'
    }

    // Check artworks
    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]

      if (!artwork.title.trim()) {
        return `Please enter a title for artwork ${i + 1}`
      }

      if (!artwork.file) {
        return `Please select an image for artwork ${i + 1}`
      }
    }

    return null
  }

  // ✅ Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate
    const error = validateForm()
    if (error) {
      toast.error(error)
      return
    }

    setIsSubmitting(true)
    const loadingToast = toast.loading('Creating contest...')

    try {
      // Step 1: Upload images
      toast.loading('Uploading images...', { id: loadingToast })

      const uploadedArtworks = await Promise.all(
        artworks.map(async (artwork, index) => {
          if (!artwork.file) {
            throw new Error(`No file for artwork ${index + 1}`)
          }

          // ✅ FIXED: Use correct variable names
          const fileExt = artwork.file.name.split('.').pop()
          const fileName = `contest-${contestData.week_number}-artwork-${
            index + 1
          }-${Date.now()}.${fileExt}`

          // Create FormData for upload
          const uploadFormData = new FormData()
          uploadFormData.append('file', artwork.file)
          uploadFormData.append('fileName', fileName)
          uploadFormData.append('bucket', 'artworks')

          const uploadResponse = await fetch('/api/admin/upload-image', {
            method: 'POST',
            body: uploadFormData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.error || 'Failed to upload image')
          }

          const { url } = await uploadResponse.json()

          return {
            title: artwork.title,
            prompt: artwork.prompt || null,
            image_url: url,
            display_order: index,
          }
        })
      )

      // Step 2: Create contest
      toast.loading('Creating contest...', { id: loadingToast })

      const response = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week_number: parseInt(contestData.week_number),
          title: contestData.title,
          description: contestData.description || null,
          start_date: contestData.start_date,
          end_date: contestData.end_date,
          status: contestData.status,
          artworks: uploadedArtworks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contest')
      }

      // Success!
      toast.success('Contest created successfully!', { id: loadingToast })
      router.push('/admin/contests')
      router.refresh()
    } catch (error) {
      console.error('Contest creation error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create contest',
        { id: loadingToast }
      )
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contest Details */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Contest Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Week Number *
            </label>
            <input
              type="number"
              required
              min="1"
              value={contestData.week_number}
              onChange={e =>
                setContestData({ ...contestData, week_number: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={contestData.status}
              onChange={e =>
                setContestData({
                  ...contestData,
                  status: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            required
            value={contestData.title}
            onChange={e =>
              setContestData({ ...contestData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Week 1: Digital Dreams"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={contestData.description}
            onChange={e =>
              setContestData({ ...contestData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={3}
            placeholder="A brief description of this week's theme..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="datetime-local"
              required
              value={contestData.start_date}
              onChange={e =>
                setContestData({ ...contestData, start_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date *
            </label>
            <input
              type="datetime-local"
              required
              value={contestData.end_date}
              onChange={e =>
                setContestData({ ...contestData, end_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* ✅ Artwork Count Selector */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Artworks * (2-12)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="2"
              max="12"
              value={artworkCount}
              onChange={e => handleArtworkCountChange(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleArtworkCountChange(artworkCount - 1)}
                disabled={artworkCount <= 2}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                -
              </button>
              <span className="px-4 py-1 bg-blue-100 text-blue-700 font-bold rounded min-w-[3rem] text-center">
                {artworkCount}
              </span>
              <button
                type="button"
                onClick={() => handleArtworkCountChange(artworkCount + 1)}
                disabled={artworkCount >= 12}
                className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Artworks */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Artworks ({artworkCount} required)
        </h2>

        <div className="space-y-6">
          {artworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className="bg-white p-6 rounded-lg shadow space-y-4"
            >
              <h3 className="font-semibold text-gray-900">
                Artwork {index + 1}
              </h3>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image *
                </label>

                {artwork.imageUrl ? (
                  <div className="relative">
                    <img
                      src={artwork.imageUrl}
                      alt={artwork.title || `Artwork ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setArtworks(prev => {
                          const updated = [...prev]
                          updated[index] = {
                            ...updated[index],
                            imageUrl: '',
                            file: null,
                          }
                          return updated
                        })
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP (max 10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageSelect(index, e)}
                      className="hidden"
                      required
                    />
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={artwork.title}
                  onChange={e => updateArtwork(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Mystic Mountains"
                />
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prompt (Optional)
                </label>
                <textarea
                  value={artwork.prompt}
                  onChange={e => updateArtwork(index, 'prompt', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="A fantasy landscape with mystic mountains at sunset"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Creating...' : 'Create Contest'}
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.push('/admin/contests')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
