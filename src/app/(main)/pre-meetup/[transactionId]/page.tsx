"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import CountdownTimer from "@/components/CountdownTimer"

type PreMeetupPageProps = {
  params: {
    transactionId: string
  }
}

type TransactionDetails = {
  id: string
  amountPaid: number
  status: string | null
  createdAt: string | null
  listing: {
    id: string | null
    title: string
    imageUrl: string | null
  }
  counterparty: {
    alias: string
    photoUrl: string | null
  }
  conversationId: string | null
}

type TransactionApiResponse = {
  transaction?: TransactionDetails
  error?: string
}

type CancelApiResponse = {
  success?: boolean
  status?: "cancel_requested" | "cancelled" | string
  message?: string
  error?: "not_authorized" | string
}

const MEETUP_SPOTS = [
  { id: "library-gate", title: "Central Library Gate", note: "Open and easy to find" },
  { id: "food-court", title: "Campus Food Court", note: "Busy spot with seating" },
  { id: "main-auditorium", title: "Main Auditorium Entrance", note: "Visible landmark point" },
]

const formatINR = (amount: number) => `Rs.${new Intl.NumberFormat("en-IN").format(amount)}`

export default function PreMeetupPage({ params }: PreMeetupPageProps) {
  const { transactionId } = params
  const router = useRouter()

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [cancelText, setCancelText] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelRequested, setCancelRequested] = useState(false)
  const [isIdentityClear, setIsIdentityClear] = useState(false)
  const [selectedSpotId, setSelectedSpotId] = useState(MEETUP_SPOTS[0].id)
  const [toastText, setToastText] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsIdentityClear(true), 80)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const loadTransaction = async () => {
      setLoading(true)
      setErrorText(null)

      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: "GET",
          signal: controller.signal,
        })

        const result = (await response.json().catch(() => ({}))) as TransactionApiResponse
        if (!response.ok) {
          setErrorText(result.error ?? "Failed to load transaction details.")
          setTransaction(null)
          return
        }

        if (!result.transaction) {
          setErrorText("Transaction details are unavailable.")
          setTransaction(null)
          return
        }

        setTransaction(result.transaction)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        setErrorText("Network error while loading transaction.")
        setTransaction(null)
      } finally {
        setLoading(false)
      }
    }

    void loadTransaction()

    return () => controller.abort()
  }, [transactionId])

  const expiryAt = useMemo(() => {
    if (!transaction?.createdAt) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const createdMs = Date.parse(transaction.createdAt)
    if (Number.isNaN(createdMs)) {
      return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    return new Date(createdMs + 24 * 60 * 60 * 1000).toISOString()
  }, [transaction?.createdAt])

  const handleStartMeetup = () => {
    router.push(`/meetup/${transactionId}`)
  }

  const handleMessage = () => {
    if (!transaction?.conversationId) {
      setErrorText("Conversation is not ready yet. Please try again shortly.")
      return
    }
    router.push(`/chat/${transaction.conversationId}`)
  }

  const handleCancelOrder = async () => {
    if (!transaction || isCancelling) {
      return
    }

    setIsCancelling(true)
    setErrorText(null)
    setCancelText(null)
    setToastText(null)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/mutual-cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "initiate" }),
      })
      const result = (await response.json().catch(() => ({}))) as CancelApiResponse

      if (result.error === "not_authorized") {
        setToastText("You are not authorized to cancel this transaction")
        setTimeout(() => setToastText(null), 1800)
        return
      }

      if (!response.ok || !result.success) {
        setErrorText("Unable to cancel order.")
        return
      }

      if (result.status === "cancel_requested") {
        setCancelRequested(true)
        setCancelText("Cancellation requested. Waiting for other party.")
        return
      }

      if (result.status === "cancelled") {
        router.replace("/home")
        return
      }

      setCancelText(result.message ?? "Order cancelled successfully.")
      setTransaction((previous) =>
        previous ? { ...previous, status: "refunded" } : previous
      )
    } catch {
      setErrorText("Network error while cancelling order.")
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-8">
      {/* ── Header ── */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / TRANSACTION
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8 md:px-8">
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">PRE-MEETUP</h1>
          <p className="mt-1 text-sm text-[#969696]">Get ready to complete your campus exchange.</p>
        </div>

        {loading ? (
          /* ── Loading skeleton ── */
          <div className="lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-14">
            <div className="space-y-6">
              <div className="flex gap-4 animate-pulse">
                <div className="w-20 h-24 lg:w-24 lg:h-28 rounded-lg bg-[#292929] shrink-0" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-2 w-16 bg-[#292929] rounded" />
                  <div className="h-4 w-3/4 bg-[#292929] rounded" />
                  <div className="h-5 w-1/3 bg-[#292929] rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-24 bg-[#292929] rounded" />
                <div className="flex gap-3">
                  <div className="w-14 h-14 rounded-full bg-[#292929]" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3 w-28 bg-[#292929] rounded" />
                    <div className="h-2 w-40 bg-[#292929] rounded" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-28 bg-[#292929] rounded" />
                <div className="h-16 w-full bg-[#292929] rounded-xl" />
                <div className="h-16 w-full bg-[#292929] rounded-xl" />
                <div className="h-16 w-full bg-[#292929] rounded-xl" />
              </div>
            </div>
            <div className="mt-6 lg:mt-0 space-y-4">
              <div className="h-24 w-full bg-[#292929] rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-[#292929] rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-[#292929] rounded-xl animate-pulse" />
            </div>
          </div>
        ) : errorText && !transaction ? (
          /* ── Error state ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-25 mb-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
              UNABLE TO LOAD
            </p>
            <p className="text-sm text-[#969696]">{errorText}</p>
          </div>
        ) : transaction ? (
          <div className="lg:grid lg:grid-cols-[1.3fr_1fr] lg:gap-14">
            {/* ═══ LEFT COLUMN ═══ */}
            <div>
              {/* ── Purchase ── */}
              <div>
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                  PURCHASE
                </span>
                <div className="flex gap-4">
                  <div className="w-20 h-24 lg:w-24 lg:h-28 rounded-lg overflow-hidden border border-[#292929] bg-[#111111] shrink-0">
                    {transaction.listing.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={transaction.listing.imageUrl}
                        alt={transaction.listing.title}
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
                    <p className="text-[11px] text-[#686D72] tracking-wide mb-1">
                      ITEM
                    </p>
                    <p className="text-sm font-medium text-[#F5F5F5] truncate">
                      {transaction.listing.title}
                    </p>
                    <p className="text-lg font-bold text-[#E5FF00] mt-2">
                      {formatINR(transaction.amountPaid)}
                    </p>
                    <p className="text-[10px] text-[#686D72] mt-1 truncate">
                      ID: {transaction.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Counterparty ── */}
              <div className="mt-8 border-t border-[#292929] pt-6">
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                  MEET WITH
                </span>
                <div
                  className={`flex items-center gap-3 p-4 bg-[#111111] border border-[#292929] rounded-xl transition-[filter] duration-700 ${
                    isIdentityClear ? "blur-0" : "blur-[8px]"
                  }`}
                >
                  <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-[#151515] border border-[#292929] flex items-center justify-center">
                    {transaction.counterparty.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={transaction.counterparty.photoUrl}
                        alt={transaction.counterparty.alias}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-[#E5FF00]">
                        {transaction.counterparty.alias[0]?.toUpperCase() ?? "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#F5F5F5]">
                      @{transaction.counterparty.alias}
                    </p>
                    <p className="text-[11px] text-[#686D72] mt-0.5">
                      Identity revealed after payment
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Meetup spots ── */}
              <div className="mt-8 border-t border-[#292929] pt-6">
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                  CHOOSE YOUR MEETUP SPOT
                </span>
                <div className="space-y-2">
                  {MEETUP_SPOTS.map((spot) => {
                    const isSelected = spot.id === selectedSpotId
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => setSelectedSpotId(spot.id)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[#E5FF00]/30 bg-[#E5FF00]/[0.04]"
                            : "border-[#292929] bg-[#111111] hover:border-[#686D72]/30"
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          isSelected ? "border-[#E5FF00]" : "border-[#686D72]/40"
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-[#E5FF00]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#F5F5F5]">{spot.title}</p>
                          <p className="text-[11px] text-[#686D72] mt-0.5">{spot.note}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Error ── */}
              {errorText ? (
                <div className="mt-6 flex items-start gap-2.5 p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e55555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-[#e55555]">{errorText}</p>
                </div>
              ) : null}

              {/* ── Cancel text ── */}
              {cancelText ? (
                <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg border border-[#292929] bg-[#111111]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <p className="text-sm text-[#BFC3C7]">{cancelText}</p>
                </div>
              ) : null}
            </div>

            {/* ═══ RIGHT SIDEBAR ═══ */}
            <div className="mt-8 lg:mt-0 lg:sticky lg:top-8 self-start">
              {/* ── Countdown ── */}
              <div className="bg-[#111111] border border-[#292929] rounded-xl p-5">
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
                  MEETUP WINDOW
                </span>
                <CountdownTimer expiresAt={expiryAt} />
              </div>

              {/* ── Actions ── */}
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={handleStartMeetup}
                  className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
                >
                  START MEETUP
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={handleMessage}
                  className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-[11px] font-semibold tracking-[0.1em] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                  </svg>
                  MESSAGE
                </button>
                {cancelRequested ? (
                  <div className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#151515] border border-[#292929] text-[#969696] text-[11px]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Cancellation requested
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isCancelling || transaction.status === "refunded"}
                    className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-[#2a1215] border border-[#3d1a1a] text-[#e55555] text-[11px] font-semibold tracking-[0.06em] transition-all duration-200 hover:bg-[#351518] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {isCancelling ? "Cancelling..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Toast ── */}
      {toastText ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit flex items-center gap-2 rounded-lg bg-[#E5FF00] px-4 py-2.5 text-sm font-semibold text-[#080808] shadow-[0_4px_24px_rgba(229,255,0,0.2)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {toastText}
        </div>
      ) : null}
    </main>
  )
}