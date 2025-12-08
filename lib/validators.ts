// lib/validators.ts
// Zod validation schemas for API requests and data validation
// This centralizes validation logic and provides type safety
// Updated for Zod v4 API compatibility

import { z } from 'zod'

// ==========================================
// VOTE VALIDATION
// ==========================================

export const voteSchema = z.object({
  artwork_id: z
    .string({ message: 'Artwork ID is required' })
    .uuid('Artwork ID must be a valid UUID'),

  contest_id: z
    .string({ message: 'Contest ID is required' })
    .uuid('Contest ID must be a valid UUID'),
})

export type VoteInput = z.infer<typeof voteSchema>

// ==========================================
// CONTEST VALIDATION
// ==========================================

export const contestSchema = z.object({
  week_number: z
    .number({ message: 'Week number is required' })
    .int('Week number must be an integer')
    .positive('Week number must be positive'),

  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be less than 200 characters'),

  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .nullable(),

  start_date: z
    .string({ message: 'Start date is required' })
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'Start date must be a valid date' }
    ),

  end_date: z
    .string({ message: 'End date is required' })
    .refine(
      (val) => {
        const date = new Date(val)
        return !isNaN(date.getTime())
      },
      { message: 'End date must be a valid date' }
    ),

  status: z
    .enum(['upcoming', 'active', 'archived'], {
      message: 'Status must be one of: upcoming, active, archived',
    })
    .optional()
    .default('active'),
})
  .refine(data => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })

export type ContestInput = z.infer<typeof contestSchema>

// ==========================================
// ARTWORK VALIDATION
// ==========================================

export const artworkSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(200, 'Title must be less than 200 characters'),

  image_url: z
    .string({ message: 'Image URL is required' })
    .url('Image URL must be a valid URL')
    .refine(
      url => {
        // Allow Supabase storage URLs or other image hosting
        return (
          url.includes('supabase.co') ||
          url.startsWith('https://') ||
          url.startsWith('http://')
        )
      },
      {
        message: 'Image URL must be a valid HTTPS URL',
      }
    ),

  prompt: z
    .string()
    .max(2000, 'Prompt must be less than 2000 characters')
    .optional()
    .nullable(),

  display_order: z
    .number()
    .int('Display order must be an integer')
    .nonnegative('Display order must be non-negative')
    .optional()
    .default(0),

  contest_id: z
    .string()
    .uuid('Contest ID must be a valid UUID')
    .optional(), // Optional because it might be added server-side
})

export type ArtworkInput = z.infer<typeof artworkSchema>

// ==========================================
// CONTEST WITH ARTWORKS (for creation)
// ==========================================

export const createContestSchema = z.object({
  week_number: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  // Accept datetime-local format (YYYY-MM-DDTHH:MM) or ISO 8601
  start_date: z.string().refine(
    (val) => {
      // Try to parse as date - will work for both formats
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: 'Start date must be a valid date' }
  ),
  end_date: z.string().refine(
    (val) => {
      const date = new Date(val)
      return !isNaN(date.getTime())
    },
    { message: 'End date must be a valid date' }
  ),
  artworks: z
    .array(artworkSchema)
    .min(1, 'At least one artwork is required')
    .max(12, 'Maximum 12 artworks per contest'),
})
  .refine(data => new Date(data.end_date) > new Date(data.start_date), {
    message: 'End date must be after start date',
    path: ['end_date'],
  })

export type CreateContestInput = z.infer<typeof createContestSchema>

// ==========================================
// HELPER FUNCTION: Safe validation with errors
// ==========================================

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod v4 uses 'issues' instead of 'errors'
      const firstError = error.issues?.[0]
      if (firstError) {
        const path = firstError.path.join('.') || 'validation'
        return {
          success: false,
          error: `${path}: ${firstError.message}`,
        }
      }
      return { success: false, error: error.message || 'Validation failed' }
    }
    // Handle non-Zod errors
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Validation failed' }
  }
}
