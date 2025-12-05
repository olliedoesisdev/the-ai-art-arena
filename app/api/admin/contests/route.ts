// app/api/admin/contests/route.ts
// API endpoint for creating and managing contests.
// Protected by admin middleware.

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      week_number,
      title,
      description,
      start_date,
      end_date,
      status,
      artworks,
    } = body

    // Validate required fields
    if (!week_number || !title || !start_date || !end_date || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!artworks || artworks.length !== 6) {
      return NextResponse.json(
        { error: 'Exactly 6 artworks are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if week number already exists
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

    // Create contest
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .insert({
        week_number,
        title,
        description,
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

    // Create artworks
    const artworksToInsert = artworks.map((artwork: any, index: number) => ({
      contest_id: contest.id,
      title: artwork.title,
      prompt: artwork.prompt,
      image_url: artwork.image_url,
      display_order: artwork.display_order ?? index,
    }))

    const { error: artworksError } = await supabase
      .from('artworks')
      .insert(artworksToInsert)

    if (artworksError) {
      console.error('Artworks creation error:', artworksError)

      // Rollback: delete the contest
      await supabase.from('contests').delete().eq('id', contest.id)

      return NextResponse.json(
        { error: 'Failed to create artworks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contest: contest,
    })
  } catch (error) {
    console.error('Contest creation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
