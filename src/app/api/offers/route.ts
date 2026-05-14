import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const offerSchema = z.object({
  conversation_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  amount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = offerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { conversation_id, listing_id, amount } = parsed.data

  // Confirm listing is active
  const { data: listing } = await supabase
    .from('listings')
    .select('id, status, seller_id')
    .eq('id', listing_id)
    .single()

  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
  }

  // Buyer cannot be the seller
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'Cannot make offer on your own listing' }, { status: 403 })
  }

  // Check no pending offer already exists in this conversation
  const { data: existing } = await supabase
    .from('messages')
    .select('id')
    .eq('conversation_id', conversation_id)
    .eq('type', 'offer')
    .contains('content', { status: 'pending' })
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'An offer is already pending in this conversation' }, { status: 409 })
  }

  // Insert offer as system message
  const { data: message, error: insertError } = await supabase
    .from('messages')
    .insert({
      conversation_id,
      sender_id: user.id,
      type: 'offer',
      content: { amount, currency: 'INR', status: 'pending' },
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
  }

  // Update conversation updated_at for inbox sort
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation_id)

  return NextResponse.json({ message_id: message.id, status: 'pending' }, { status: 201 })
}
