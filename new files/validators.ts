// lib/validators.ts
// Zod schemas for validating all API route inputs
// Import and use these at the top of every API route - never trust raw request bodies

import { z } from 'zod'

// ----------------------------------------
// Vote endpoint schema
// ----------------------------------------
export const voteSchema = z.object({
  artwork_id: z
    .string({ required_error: 'artwork_id is required' })
    .uuid('artwork_id must be a valid UUID'),

  contest_id: z
    .string({ required_error: 'contest_id is required' })
    .uuid('contest_id must be a valid UUID'),
})

export type VoteInput = z.infer<typeof voteSchema>

// ----------------------------------------
// Generic safe parse helper
// Returns typed data on success, formatted error string on failure
// ----------------------------------------
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; error: string; details: z.ZodIssue[] } {
  const result = schema.safeParse(data)

  if (!result.success) {
    const firstError = result.error.errors[0]
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Invalid input'

    return {
      success: false,
      error: message,
      details: result.error.errors,
    }
  }

  return { success: true, data: result.data }
}
