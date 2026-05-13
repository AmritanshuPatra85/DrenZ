import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { wati } from '@/lib/wati'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  // Step 1 — Signature validation
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  // Step 2 — Only handle payment.captured
  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const payment = event.payload.payment.entity
  const razorpayOrderId = payment.order_id
  const razorpayPaymentId = payment.id
  const amount = payment.amount // in paise
  const notes = payment.notes

  const listingId = notes?.listing_id
  const buyerId = notes?.buyer_id
  const sellerId = notes?.seller_id

  const supabase = createServerClient()

  // Step 3 — Idempotency check
  const { data: existingTxn } = await supabase
    .from('transactions')
    .select('id')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .maybeSingle()

  if (existingTxn) {
    return NextResponse.json({ received: true })
  }

  // Step 4 — Generate handoff code
  const code = Math.floor(1000 + Math.random() * 9000).toString()
  const handoffCodeHash = await bcrypt.hash(code, 10)

  // Step 5 — Create transaction record
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { error: txnError } = await supabase.from('transactions').insert({
    listing_id: listingId,
    buyer_id: buyerId,
    seller_id: sellerId,
    amount,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    handoff_code_hash: handoffCodeHash,
    status: 'payment_captured',
    expires_at: expiresAt,
  })

  if (txnError) {
    console.error('Transaction insert failed:', txnError)
    return NextResponse.json({ received: true }) // still 200 so Razorpay doesn't retry
  }

  // Step 6 — Reserve the listing
  await supabase
    .from('listings')
    .update({ status: 'reserved' })
    .eq('id', listingId)

  // Step 7 — Reveal identities on the conversation
  await supabase
    .from('conversations')
    .update({ identity_revealed: true })
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)

  // Step 8 — Fetch buyer and seller phone numbers
  const { data: buyer } = await supabase
    .from('profiles')
    .select('phone, alias')
    .eq('id', buyerId)
    .single()

  const { data: seller } = await supabase
    .from('profiles')
    .select('phone, alias')
    .eq('id', sellerId)
    .single()

  const { data: listing } = await supabase
    .from('listings')
    .select('title')
    .eq('id', listingId)
    .single()

  // Step 9 — WhatsApp both parties
  if (buyer?.phone) {
    await wati.sendHandoffReminderBuyer(
      buyer.phone,
      buyer.alias,
      listing?.title ?? 'your item',
      code
    )
  }

  if (seller?.phone) {
    await wati.sendPaymentConfirmed(
      seller.phone,
      seller.alias,
      `₹${amount / 100}`,
      listing?.title ?? 'your item'
    )
  }

  return NextResponse.json({ received: true })
}