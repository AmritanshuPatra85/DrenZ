"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import CountdownTimer from "@/components/CountdownTimer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
  message?: string
  error?: string
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
  const [isIdentityClear, setIsIdentityClear] = useState(false)
  const [selectedSpotId, setSelectedSpotId] = useState(MEETUP_SPOTS[0].id)

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

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/mutual-cancel`, {
        method: "POST",
      })
      const result = (await response.json().catch(() => ({}))) as CancelApiResponse

      if (!response.ok || !result.success) {
        setErrorText(result.error ?? "Unable to cancel order.")
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
    <main className="min-h-screen bg-brand-dark px-3 pb-8 pt-5 text-white sm:px-4">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-xl font-bold text-white">Pre-Meetup</h1>
        <p className="mt-1 text-sm text-white/60">Finalize details before meeting on campus.</p>

        {loading ? (
          <Card className="mt-4 border-white/10 bg-brand-card p-6">
            <p className="text-center text-sm text-white/60">Loading transaction...</p>
          </Card>
        ) : errorText && !transaction ? (
          <Card className="mt-4 border-red-400/30 bg-red-500/10 p-6">
            <p className="text-center text-sm text-red-200">{errorText}</p>
          </Card>
        ) : transaction ? (
          <>
            <Card className="mt-4 border-white/10 bg-brand-card p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Counterparty
              </p>
              <div
                className={`mt-3 flex items-center gap-3 transition-[filter] duration-700 ${
                  isIdentityClear ? "blur-0" : "blur-[8px]"
                }`}
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black/25">
                  {transaction.counterparty.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={transaction.counterparty.photoUrl}
                      alt={transaction.counterparty.alias}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-brand-yellow">
                      {transaction.counterparty.alias[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{transaction.counterparty.alias}</p>
                  <p className="text-xs text-white/60">Identity revealed after payment</p>
                </div>
              </div>
            </Card>

            <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Transaction Summary
              </p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/70">Item</span>
                  <span className="max-w-[65%] truncate text-right text-white">
                    {transaction.listing.title}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/70">Amount paid</span>
                  <span className="font-semibold text-brand-yellow">
                    {formatINR(transaction.amountPaid)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-white/70">Transaction ID</span>
                  <span className="max-w-[65%] truncate text-right text-white/90">
                    {transaction.id}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Suggested Meetup Spots
              </p>
              <div className="mt-3 grid gap-2">
                {MEETUP_SPOTS.map((spot) => {
                  const isSelected = spot.id === selectedSpotId
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setSelectedSpotId(spot.id)}
                      className={`rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "border-brand-yellow/70 bg-brand-yellow/15"
                          : "border-white/10 bg-black/10 hover:border-white/30"
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{spot.title}</p>
                      <p className="mt-0.5 text-xs text-white/60">{spot.note}</p>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
              <CountdownTimer expiresAt={expiryAt} />
            </Card>

            {errorText ? (
              <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorText}
              </p>
            ) : null}

            {cancelText ? (
              <p className="mt-3 rounded-xl border border-green-400/30 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                {cancelText}
              </p>
            ) : null}

            <div className="mt-4 grid gap-2 pb-3">
              <Button
                type="button"
                onClick={handleStartMeetup}
                className="h-10 bg-brand-yellow text-black hover:bg-brand-yellow/90"
              >
                Start Meetup
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleMessage}
                className="h-10 bg-brand-card text-white hover:bg-white/10"
              >
                Message
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelOrder}
                disabled={isCancelling || transaction.status === "refunded"}
                className="h-10"
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
