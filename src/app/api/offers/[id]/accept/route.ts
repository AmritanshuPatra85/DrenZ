import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const offerId = params.id

  // Fetch the offer message
  const { data: offer } = await supabase
    .from('messages')
    .select('id, conversation_id, type, content')
    .eq('id', offerId)
    .eq('type', 'offer')
    .single()

  if (!offer) {
    return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
  }

  if (offer.content.status !== 'pending') {
    return NextResponse.json({ error: 'Offer is no longer pending' }, { status: 409 })
  }

  // Verify current user is the seller of this listing
  const { data: conversation } = await supabase
    .from('conversations')
    .select('listing_id, listings(seller_id)')
    .eq('id', offer.conversation_id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const sellerId = (conversation.listings as any)?.seller_id
  if (sellerId !== user.id) {
    return NextResponse.json({ error: 'Only the seller can accept an offer' }, { status: 403 })
  }

  // Update offer status to accepted
  await supabase
    .from('messages')
    .update({ content: { ...offer.content, status: 'accepted' } })
    .eq('id', offerId)

  // Store agreed price on the conversation
  await supabase
    .from('conversations')
    .update({
      agreed_price: offer.content.amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', offer.conversation_id)

  // Insert a system message so chat UI shows the confirmation
  await supabase.from('messages').insert({
    conversation_id: offer.conversation_id,
    sender_id: user.id,
    type: 'system',
    content: {
      text: `Offer of ₹${offer.content.amount} accepted. Tap Buy Now to complete your purchase.`,
    },
  })

  return NextResponse.json({ success: true, agreed_price: offer.content.amount })
}