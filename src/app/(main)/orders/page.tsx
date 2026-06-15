"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Transaction = {
  id: string
  listing_id: string
  status: string
  amount: number
  use_delivery: boolean
  delivery_address: string | null
  handoff_code: string | null
  created_at: string
  listing: {
    title: string
    image_url: string | null
  } | null
  seller: {
    alias: string
  } | null
}

const formatINR = (amount: number) =>
  `₹${new Intl.NumberFormat("en-IN").format(amount / 100)}`

const STATUS_LABELS: Record<string, string> = {
  payment_captured: "Payment Confirmed",
  handoff_pending: "Awaiting Handoff",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
}

export default function OrderPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const supabase = useMemo(() => createClient(), [])

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return

    const load = async () => {
      setLoading(true)

      // Poll for up to 8 seconds — webhook may not have fired yet
      let data = null
      for (let i = 0; i < 8; i++) {
        const { data: txn } = await supabase
          .from("transactions")
          .select(`
            id, listing_id, status, amount, use_delivery,
            delivery_address, handoff_code, created_at,
            listing:listings(title, image_url),
            seller:users!transactions_seller_id_fkey(alias)
          `)
          .eq("razorpay_order_id", orderId)
          .maybeSingle()

        if (txn) { data = txn; break }
        await new Promise((r) => setTimeout(r, 1000))
      }

      if (!data) {
        setError("Could not load your order. Payment was successful — check My Purchases.")
      } else {
        setTransaction(data as unknown as Transaction)
      }

      setLoading(false)
    }

    void load()
  }, [orderId, supabase])

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-dark flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <p className="text-sm text-white/60">Confirming your payment...</p>
        </div>
      </main>
    )
  }

  if (error || !transaction) {
    return (
      <main className="min-h-screen bg-brand-dark flex items-center justify-center text-white px-4">
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-base font-semibold">Payment Successful!</p>
          <p className="text-sm text-white/60 mt-2">{error}</p>
          <Button
            onClick={() => router.push("/purchases")}
            className="mt-4 bg-brand-yellow text-black font-bold"
          >
            View My Purchases
          </Button>
        </div>
      </main>
    )
  }

  const listing = Array.isArray(transaction.listing)
    ? transaction.listing[0]
    : transaction.listing

  const seller = Array.isArray(transaction.seller)
    ? transaction.seller[0]
    : transaction.seller

  return (
    <main className="min-h-screen bg-brand-dark px-3 pb-8 pt-5 text-white sm:px-4">
      <div className="mx-auto w-full max-w-2xl">

        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.push("/home")} className="text-white/50 text-sm">← Home</button>
          <h1 className="text-xl font-bold flex-1">Order Confirmed</h1>
        </div>

        {/* Success banner */}
        <div className="rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-4 mb-4 text-center">
          <div className="text-3xl mb-1">🎉</div>
          <p className="text-base font-bold text-green-400">Payment Successful!</p>
          <p className="text-xs text-white/60 mt-1">
            {STATUS_LABELS[transaction.status] ?? transaction.status}
          </p>
        </div>

        {/* Item */}
        <Card className="border-white/10 bg-brand-card p-3 sm:p-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/20">
              {listing?.image_url ? (
                <img src={listing.image_url} alt={listing.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[11px] text-white/40">
                  No image
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{listing?.title ?? "Item"}</p>
              <p className="text-xs text-white/50 mt-0.5">Sold by {seller?.alias ?? "Seller"}</p>
              <p className="text-base font-bold text-brand-yellow mt-1">{formatINR(transaction.amount)}</p>
            </div>
          </div>
        </Card>

        {/* Handoff code */}
        <Card className="border-white/10 bg-brand-card p-4 mb-3 text-center">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-2">Your Handoff Code</p>
          {transaction.handoff_code ? (
            <p className="text-5xl font-black tracking-[0.3em] text-brand-yellow">
              {transaction.handoff_code}
            </p>
          ) : (
            <p className="text-sm text-white/40">Code will appear here after meetup is arranged</p>
          )}
          <p className="text-xs text-white/40 mt-3">
            Share this code with the seller during handoff to complete the transaction.
          </p>
        </Card>

        {/* Delivery info */}
        {transaction.use_delivery && (
          <Card className="border-white/10 bg-brand-card p-3 mb-3">
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Delivery Address</p>
            <p className="text-sm text-white">{transaction.delivery_address ?? "—"}</p>
          </Card>
        )}

        {/* Next steps */}
        <Card className="border-white/10 bg-brand-card p-4 mb-4">
          <p className="text-sm font-semibold text-white mb-3">Next Steps</p>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex gap-2">
              <span className="text-brand-yellow font-bold">1.</span>
              <span>Message the seller to arrange a meetup on campus.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-yellow font-bold">2.</span>
              <span>Show your handoff code to the seller during the meetup.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-yellow font-bold">3.</span>
              <span>Seller confirms the code — transaction is complete!</span>
            </div>
          </div>
        </Card>

        <Button
          onClick={() => router.push("/purchases")}
          className="w-full bg-brand-yellow text-black font-bold h-11"
        >
          View My Purchases
        </Button>

      </div>
    </main>
  )
}