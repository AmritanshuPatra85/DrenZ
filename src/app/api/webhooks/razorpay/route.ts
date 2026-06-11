import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature')

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event !== 'payment.captured') {
    return NextResponse.json({ received: true })
  }

  const payment = event.payload.payment.entity
  const razorpayOrderId = payment.order_id
  const razorpayPaymentId = payment.id
  const amount = payment.amount
  const notes = payment.notes

  const listingId = notes?.listing_id
  const buyerId = notes?.buyer_id
  const sellerId = notes?.seller_id
  const useDelivery = notes?.use_delivery === 'true'
  const deliveryAddress = notes?.delivery_address ?? null

  const supabase = createClient()

  const { data: existingTxn } = await supabase
    .from('transactions')
    .select('id')
    .eq('razorpay_payment_id', razorpayPaymentId)
    .maybeSingle()

  if (existingTxn) {
    return NextResponse.json({ received: true })
  }

  const code = Math.floor(1000 + Math.random() * 9000).toString()
  const handoffCodeHash = await bcrypt.hash(code, 10)

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
    use_delivery: useDelivery,
    delivery_address: useDelivery ? deliveryAddress : null,
  })

  if (txnError) {
    console.error('Transaction insert failed:', txnError)
    return NextResponse.json({ received: true })
  }

  await supabase
    .from('listings')
    .update({ status: 'reserved' })
    .eq('id', listingId)

  await supabase
    .from('conversations')
    .update({ identity_revealed: true })
    .eq('listing_id', listingId)
    .eq('buyer_id', buyerId)

  const { data: listing } = await supabase
    .from('listings')
    .select('title')
    .eq('id', listingId)
    .single()

  const listingTitle = listing?.title ?? 'your item'

  const { data: buyerData } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', buyerId)
    .single()

  const { data: sellerData } = await supabase
    .from('users')
    .select('fcm_token')
    .eq('id', sellerId)
    .single()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Insert in-app notifications
  await supabase.from('notifications').insert({
    user_id: buyerId,
    type: 'payment_success',
    title: 'Payment Successful!',
    body: `You've paid for "${listingTitle}". Meet the seller to complete the handoff.`,
    data: { listing_id: listingId, razorpay_order_id: razorpayOrderId },
  })

  await supabase.from('notifications').insert({
    user_id: sellerId,
    type: 'payment_received',
    title: 'Payment Received!',
    body: `Someone paid for "${listingTitle}". Arrange a meetup to hand it off.`,
    data: { listing_id: listingId, razorpay_order_id: razorpayOrderId },
  })

  // Send push notifications
  if (buyerData?.fcm_token) {
    await fetch(`${baseUrl}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: buyerData.fcm_token,
        title: 'Payment Successful!',
        body: `You've paid for "${listingTitle}". Meet the seller to complete the handoff.`,
        data: { listing_id: listingId },
      }),
    })
  }

  if (sellerData?.fcm_token) {
    await fetch(`${baseUrl}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: sellerData.fcm_token,
        title: 'Payment Received!',
        body: `Someone paid for "${listingTitle}". Arrange a meetup to hand it off.`,
        data: { listing_id: listingId },
      }),
    })
  }

  return NextResponse.json({ received: true })
}