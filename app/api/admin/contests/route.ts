// app/api/admin/contests/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateData, createContestSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body with Zod
    const validation = validateData(createContestSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { week_number, start_date, end_date, artworks, title, description } =
      validation.data

    // Use admin client to bypass RLS
    const supabaseAdmin = await createAdminClient()

    // Check if week number already exists
    const { data: existingContest } = await supabaseAdmin
      .from('contests')
      .select('week_number')
      .eq('week_number', week_number)
      .single()

    if (existingContest) {
      return NextResponse.json(
        { error: `Contest for week ${week_number} already exists` },
        { status: 409 }
      )
    }

    // Create contest (using admin client)
    const { data: contest, error: contestError } = await supabaseAdmin
      .from('contests')
      .insert({
        week_number,
        title: title || `Week ${week_number} Contest`,
        description: description || null,
        start_date,
        end_date,
        status: 'active',
      })
      .select()
      .single()

    if (contestError) {
      console.error('Contest creation error:', contestError)
      return NextResponse.json(
        { error: 'Failed to create contest: ' + contestError.message },
        { status: 500 }
      )
    }

    // Create artworks (using admin client)
    const artworksWithContestId = artworks.map((artwork) => ({
      contest_id: contest.id,
      title: artwork.title,
      image_url: artwork.image_url,
      vote_count: 0,
    }))

    const { error: artworksError } = await supabaseAdmin
      .from('artworks')
      .insert(artworksWithContestId)

    if (artworksError) {
      console.error('Artworks creation error:', artworksError)
      // Rollback: delete the contest
      await supabaseAdmin.from('contests').delete().eq('id', contest.id)

      return NextResponse.json(
        { error: 'Failed to create artworks: ' + artworksError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contest: {
        id: contest.id,
        week_number: contest.week_number,
      },
    })
  } catch (error) {
    console.error('Contest creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create contest' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Contest ID is required' }, { status: 400 })
    }

    const supabaseAdmin = await createAdminClient()

    const { error } = await supabaseAdmin
      .from('contests')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('status', 'active') // safety: only archive active contests

    if (error) {
      console.error('Contest archive error:', error)
      return NextResponse.json({ error: 'Failed to archive contest' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contest archive error:', error)
    return NextResponse.json({ error: 'Failed to archive contest' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Use admin client for reading contests too
    const supabaseAdmin = await createAdminClient()

    const { data: contests, error } = await supabaseAdmin
      .from('contests')
      .select('*')
      .order('week_number', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch contests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ contests })
  } catch (error) {
    console.error('Fetch contests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contests' },
      { status: 500 }
    )
  }
}
