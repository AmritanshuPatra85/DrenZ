import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { razorpay } from '@/lib/razorpay'
import { z } from 'zod'

const checkoutSchema = z.object({
  listing_id: z.string().uuid(),
  use_buyer_protection: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { listing_id, use_buyer_protection } = parsed.data

  // Fetch listing — must be active
  const { data: listing } = await supabase
    .from('listings')
    .select('id, status, seller_id, price, title')
    .eq('id', listing_id)
    .single()

  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing not available' }, { status: 400 })
  }

  // Buyer cannot be the seller
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 403 })
  }

  // Check if there's an accepted offer for this buyer in this conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('agreed_price')
    .eq('listing_id', listing_id)
    .eq('buyer_id', user.id)
    .maybeSingle()

  const baseAmount = conversation?.agreed_price ?? listing.price

  // Add buyer protection fee if opted in (₹10)
  const totalAmount = baseAmount + (use_buyer_protection ? 10 : 0)

  // Amount in paise for Razorpay
  const amountInPaise = totalAmount * 100

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: listing_id,
    notes: {
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
    },
  })

  return NextResponse.json({
    order_id: order.id,
    amount: amountInPaise,
    currency: 'INR',
    razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
  })
}