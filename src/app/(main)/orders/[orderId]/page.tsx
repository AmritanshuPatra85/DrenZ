"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
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

  /* ── Loading state ── */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase mb-8">
            DRENZ / TRANSACTION
          </p>
          <div className="flex justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="1.5" className="animate-spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h1 className="text-lg font-bold tracking-tight mb-1">CONFIRMING ORDER</h1>
          <p className="text-sm text-[#969696]">Confirming your payment...</p>
          <p className="text-[11px] text-[#686D72] mt-3">This may take a few moments.</p>
        </div>
      </main>
    )
  }

  /* ── Error / fallback state ── */
  if (error || !transaction) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col items-center justify-center px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <p className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase mb-8">
            DRENZ / TRANSACTION
          </p>
          <div className="mb-6 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-[#E5FF00]/10 border border-[#E5FF00]/20 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-bold tracking-tight mb-1">PAYMENT SUCCESSFUL</h1>
          <p className="text-sm text-[#969696] mt-2">{error}</p>
          <button
            onClick={() => router.push("/purchases")}
            className="group mt-8 inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
          >
            VIEW MY PURCHASES
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
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
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-8">
      {/* ── Header ── */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-[1140px] flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.push("/home")}
            aria-label="Back to home"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            HOME
          </button>
          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / TRANSACTION
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1140px] px-4 pt-8 md:px-8">
        {/* ── Title ── */}
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            ORDER<br className="sm:hidden" /> CONFIRMED
          </h1>
          <p className="mt-1 text-sm text-[#969696]">Your purchase is locked in.</p>
        </div>

        {/* ── Confirmation + status ── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-full bg-[#E5FF00]/10 border border-[#E5FF00]/20 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F5F5F5]">
              {STATUS_LABELS[transaction.status] ?? transaction.status}
            </p>
            <p className="text-[11px] text-[#686D72]">Order {transaction.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
          {/* ═══ LEFT COLUMN ═══ */}
          <div>
            {/* ── Purchase ── */}
            <div>
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                PURCHASE
              </span>
              <div className="flex gap-4">
                <div className="w-20 h-24 lg:w-24 lg:h-28 rounded-lg overflow-hidden border border-[#292929] bg-[#111111] shrink-0">
                  {listing?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.image_url}
                      alt={listing.title ?? "Item"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F5F5] truncate">
                    {listing?.title ?? "Item"}
                  </p>
                  <p className="text-[11px] text-[#686D72] mt-1">
                    Sold by @{seller?.alias ?? "Seller"}
                  </p>
                  <p className="text-lg font-bold text-[#E5FF00] mt-2">
                    {formatINR(transaction.amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Handoff code (mobile: here, desktop: right column) ── */}
            <div className="mt-8 lg:hidden">
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                HANDOFF CODE
              </span>
              <div className="bg-[#111111] border border-[#292929] rounded-xl p-5 text-center">
                {transaction.handoff_code ? (
                  <>
                    <p className="font-mono text-4xl font-black tracking-[0.35em] text-[#E5FF00] mb-3">
                      {transaction.handoff_code}
                    </p>
                    <p className="text-[11px] text-[#686D72] leading-relaxed">
                      Show this code to the seller during handoff to complete the transaction.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-[#969696] mb-1">Code pending</p>
                    <p className="text-[11px] text-[#686D72]">
                      Code will appear here after meetup is arranged
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* ── Delivery address ── */}
            {transaction.use_delivery && (
              <div className="mt-8 border-t border-[#292929] pt-6">
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
                  DELIVERY ADDRESS
                </span>
                <div className="bg-[#111111] border border-[#292929] rounded-xl p-4">
                  <div className="flex items-start gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <p className="text-sm text-[#BFC3C7]">
                      {transaction.delivery_address ?? "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Next steps ── */}
            <div className="mt-8 border-t border-[#292929] pt-6">
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                WHAT HAPPENS NEXT
              </span>
              <div className="space-y-4">
                {[
                  "Message the seller to arrange a meetup on campus.",
                  "Show your handoff code to the seller during the meetup.",
                  "Seller confirms the code — transaction is complete!",
                ].map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-[11px] font-bold text-[#E5FF00] mt-px shrink-0 w-4 text-right">
                      {index + 1}.
                    </span>
                    <p className="text-sm text-[#969696] leading-relaxed">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mobile CTA ── */}
            <div className="mt-8 lg:hidden">
              <button
                onClick={() => router.push("/purchases")}
                className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
              >
                VIEW MY PURCHASES
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR (desktop) ═══ */}
          <div className="hidden lg:block lg:sticky lg:top-8 self-start mt-8 lg:mt-0">
            {/* ── Handoff code ── */}
            <div className="bg-[#111111] border border-[#292929] rounded-xl p-6 text-center">
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-5">
                HANDOFF CODE
              </span>
              {transaction.handoff_code ? (
                <>
                  <p className="font-mono text-5xl font-black tracking-[0.35em] text-[#E5FF00] mb-4">
                    {transaction.handoff_code}
                  </p>
                  <p className="text-[11px] text-[#686D72] leading-relaxed">
                    Show this code to the seller during handoff to complete the transaction.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#969696] mb-1">Code pending</p>
                  <p className="text-[11px] text-[#686D72]">
                    Code will appear here after meetup is arranged
                  </p>
                </>
              )}
            </div>

            {/* ── Delivery info (desktop sidebar) ── */}
            {transaction.use_delivery && (
              <div className="mt-4 bg-[#111111] border border-[#292929] rounded-xl p-4">
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
                  DELIVERY ADDRESS
                </span>
                <div className="flex items-start gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <p className="text-sm text-[#BFC3C7]">
                    {transaction.delivery_address ?? "—"}
                  </p>
                </div>
              </div>
            )}

            {/* ── Desktop CTA ── */}
            <div className="mt-4">
              <button
                onClick={() => router.push("/purchases")}
                className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
              >
                VIEW MY PURCHASES
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}