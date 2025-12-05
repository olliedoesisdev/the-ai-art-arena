// components/admin/CreateContestForm.tsx
// Client component for creating new contests with artwork upload.
// This handles form validation, file uploads, and submission.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from 'sonner'

type ArtworkDraft = {
  id: string // Temporary ID for React keys
  title: string
  prompt: string
  imageUrl: string
  file: File | null
}

export function CreateContestForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Contest metadata
  const [weekNumber, setWeekNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<'active' | 'upcoming' | 'archived'>(
    'upcoming'
  )

  // Artworks (6 required)
  const [artworks, setArtworks] = useState<ArtworkDraft[]>([
    { id: '1', title: '', prompt: '', imageUrl: '', file: null },
    { id: '2', title: '', prompt: '', imageUrl: '', file: null },
    { id: '3', title: '', prompt: '', imageUrl: '', file: null },
    { id: '4', title: '', prompt: '', imageUrl: '', file: null },
    { id: '5', title: '', prompt: '', imageUrl: '', file: null },
    { id: '6', title: '', prompt: '', imageUrl: '', file: null },
  ])

  // Handle artwork field changes
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

  // Handle image file selection
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

  // Validate form before submission
  function validateForm(): string | null {
    // Check contest metadata
    if (!weekNumber || parseInt(weekNumber) < 1) {
      return 'Please enter a valid week number'
    }

    if (!title.trim()) {
      return 'Please enter a contest title'
    }

    if (!startDate || !endDate) {
      return 'Please select start and end dates'
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return 'End date must be after start date'
    }

    // Check artworks
    for (let i = 0; i < artworks.length; i++) {
      const artwork = artworks[i]

      if (!artwork.title.trim()) {
        return `Please enter a title for artwork ${i + 1}`
      }

      if (!artwork.imageUrl) {
        return `Please select an image for artwork ${i + 1}`
      }
    }

    return null // Valid
  }

  // Handle form submission
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
      // Step 1: Upload images to Supabase Storage
      toast.loading('Uploading images...', { id: loadingToast })

      const uploadedArtworks = await Promise.all(
        artworks.map(async (artwork, index) => {
          if (!artwork.file) {
            throw new Error(`No file for artwork ${index + 1}`)
          }

          // Create a unique filename
          const fileExt = artwork.file.name.split('.').pop()
          const fileName = `contest-${weekNumber}-artwork-${
            index + 1
          }-${Date.now()}.${fileExt}`

          // Upload to Supabase Storage
          const formData = new FormData()
          formData.append('file', artwork.file)
          formData.append('fileName', fileName)
          formData.append('bucket', 'artworks')

          const uploadResponse = await fetch('/api/admin/upload-image', {
            method: 'POST',
            body: formData,
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

      // Step 2: Create contest with artworks
      toast.loading('Creating contest...', { id: loadingToast })

      const response = await fetch('/api/admin/contests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          week_number: parseInt(weekNumber),
          title,
          description: description || null,
          start_date: startDate,
          end_date: endDate,
          status,
          artworks: uploadedArtworks,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create contest')
      }

      const { contest } = await response.json()

      // Success!
      toast.success('Contest created successfully!', { id: loadingToast })

      // Redirect to contest management page
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
      {/* Contest Metadata */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Contest Details
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Week Number */}
          <div>
            <label
              htmlFor="weekNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Week Number *
            </label>
            <input
              id="weekNumber"
              type="number"
              min="1"
              value={weekNumber}
              onChange={e => setWeekNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Status *
            </label>
            <select
              id="status"
              value={status}
              onChange={e => setStatus(e.target.value as typeof status)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="upcoming">Upcoming</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Title */}
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Contest Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Week 1: Fantasy Landscapes"
              required
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Vote on your favorite AI-generated fantasy landscape"
            />
          </div>

          {/* Start Date */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Start Date *
            </label>
            <input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              End Date *
            </label>
            <input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </Card>

      {/* Artworks */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Artworks (6 required)
        </h2>

        <div className="space-y-6">
          {artworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className="p-4 border border-gray-200 rounded-lg"
            >
              <h3 className="font-semibold text-gray-900 mb-4">
                Artwork {index + 1}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Upload */}
                <div className="md:col-span-2">
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
                      />
                    </label>
                  )}
                </div>

                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={artwork.title}
                    onChange={e =>
                      updateArtwork(index, 'title', e.target.value)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mystic Mountains"
                    required
                  />
                </div>

                {/* Prompt */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt (optional)
                  </label>
                  <textarea
                    value={artwork.prompt}
                    onChange={e =>
                      updateArtwork(index, 'prompt', e.target.value)
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="A fantasy landscape with mystic mountains at sunset"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Submit Buttons */}
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
