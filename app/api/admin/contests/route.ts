// app/api/admin/contests/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// ✅ Input validation schema
const CreateContestSchema = z.object({
  week_number: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  status: z.enum(['active', 'upcoming', 'archived']),
  artworks: z
    .array(
      z.object({
        title: z.string().min(1).max(200),
        prompt: z.string().max(1000).nullable().optional(),
        image_url: z.string().url(),
        display_order: z.number().int().min(0),
      })
    )
    .min(2, 'At least 2 artworks required')
    .max(12, 'Maximum 12 artworks allowed'),
})

export async function POST(request: NextRequest) {
  try {
    // ✅ Auth is handled by proxy.ts - we can trust the request here

    // ✅ 1. Parse and validate input
    const body = await request.json()

    const result = CreateContestSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    const {
      week_number,
      title,
      description,
      start_date,
      end_date,
      status,
      artworks,
    } = result.data

    // ✅ 2. Validate date logic
    if (new Date(start_date) >= new Date(end_date)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ✅ 3. Check for duplicate week number
    const { data: existing } = await supabase
      .from('contests')
      .select('id')
      .eq('week_number', week_number)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: `Week ${week_number} already exists` },
        { status: 409 }
      )
    }

    // ✅ 4. Create contest
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .insert({
        week_number,
        title,
        description: description || null,
        start_date,
        end_date,
        status,
      })
      .select()
      .single()

    if (contestError) {
      console.error('Contest creation error:', contestError)
      return NextResponse.json(
        { error: 'Failed to create contest' },
        { status: 500 }
      )
    }

    // ✅ 5. Create artworks (with proper typing)
    const artworksToInsert = artworks.map(artwork => ({
      contest_id: contest.id,
      title: artwork.title,
      prompt: artwork.prompt || null,
      image_url: artwork.image_url,
      display_order: artwork.display_order,
    }))

    const { error: artworksError } = await supabase
      .from('artworks')
      .insert(artworksToInsert)

    if (artworksError) {
      console.error('Artworks creation error:', artworksError)

      // ✅ 6. Rollback: delete the contest
      await supabase.from('contests').delete().eq('id', contest.id)

      return NextResponse.json(
        { error: 'Failed to create artworks' },
        { status: 500 }
      )
    }

    // ✅ 7. Return success with full contest data
    return NextResponse.json({
      success: true,
      contest: {
        ...contest,
        artworks: artworksToInsert,
      },
    })
  } catch (error) {
    console.error('Contest creation error:', error)

    // ✅ 8. Safe error response
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'An unexpected error occurred'
            : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

// ✅ GET endpoint for listing contests
export async function GET(request: NextRequest) {
  try {
    // ✅ Auth is handled by proxy.ts

    const supabase = await createClient()

    // Get all contests with artwork counts
    const { data: contests, error } = await supabase
      .from('contests')
      .select(
        `
        *,
        artworks (
          id,
          title,
          image_url,
          vote_count,
          display_order
        )
      `
      )
      .order('week_number', { ascending: false })

    if (error) {
      console.error('Contests fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch contests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ contests })
  } catch (error) {
    console.error('Contests fetch error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
