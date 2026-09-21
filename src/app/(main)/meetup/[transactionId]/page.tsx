"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import CountdownTimer from "@/components/CountdownTimer"
import HandoffCode from "@/components/handoff/HandoffCode"
import { createClient } from "@/lib/supabase/client"

type MeetupPageProps = {
  params: {
    transactionId: string
  }
}

type TransactionDetails = {
  id: string
  amountPaid: number
  status: string | null
  createdAt: string | null
  handoffConfirmedAt?: string | null
  viewerRole: "buyer" | "seller"
  handoffCode: string | null
  conversationId: string | null
}

type TransactionApiResponse = {
  transaction?: TransactionDetails
  error?: string
}

type ValidateCodeResponse = {
  success?: boolean
  transaction?: {
    id: string
    status: "completed" | string
  }
  error?: "invalid_code" | "locked_out" | string
  attempts_remaining?: number
}

type MutualCancelResponse = {
  success?: boolean
  status?: "cancel_requested" | "cancelled" | string
  error?: "not_authorized" | string
}

type ActionApiResponse = {
  success?: boolean
  message?: string
  error?: string
}

export default function MeetupPage({ params }: MeetupPageProps) {
  const { transactionId } = params
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isConfirmingCancelRef = useRef(false)

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [actionText, setActionText] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [isValidating, setIsValidating] = useState(false)
  const [sellerIsCorrect, setSellerIsCorrect] = useState(false)
  const [sellerIsError, setSellerIsError] = useState(false)
  const [sellerIsLocked, setSellerIsLocked] = useState(false)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>(
    undefined,
  )
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)

  const isSeller = transaction?.viewerRole === "seller"
  const isBuyer = transaction?.viewerRole === "buyer"

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

  const showToast = (message: string) => {
    setToastMessage(message)

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => setToastMessage(null), 1800)
  }

  const redirectForEvent = useCallback(
    (eventName: "mutual_cancel" | "code_validated" | "dispute_filed") => {
      if (eventName === "code_validated") {
        router.replace(`/rating/${transactionId}`)
        return
      }

      router.replace(`/pre-meetup/${transactionId}`)
    },
    [router, transactionId],
  )

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

        if (!response.ok || !result.transaction) {
          setErrorText(result.error ?? "Unable to load meetup details.")
          setTransaction(null)
          return
        }

        setTransaction(result.transaction)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }

        setErrorText("Network error while loading meetup.")
        setTransaction(null)
      } finally {
        setLoading(false)
      }
    }

    void loadTransaction()

    return () => controller.abort()
  }, [transactionId])

  const broadcastEvent = useCallback(
    async (
      eventName: "mutual_cancel" | "code_validated" | "dispute_filed",
      payload?: Record<string, unknown>,
    ) => {
      if (!channelRef.current) {
        return
      }

      await channelRef.current.send({
        type: "broadcast",
        event: eventName,
        payload: {
          transactionId,
          ...payload,
        },
      })
    },
    [transactionId],
  )

  const postMutualCancel = useCallback(
    async (action: "initiate" | "confirm") => {
      const response = await fetch(
        `/api/transactions/${transactionId}/mutual-cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      )

      const result = (await response.json().catch(() => ({}))) as MutualCancelResponse

      return { response, result }
    },
    [transactionId],
  )

  const confirmMutualCancelFromEvent = useCallback(async () => {
    if (isConfirmingCancelRef.current) {
      return
    }

    isConfirmingCancelRef.current = true

    try {
      const { result } = await postMutualCancel("confirm")

      if (result.success && result.status === "cancelled") {
        router.replace("/home")
        return
      }

      if (result.success && result.status === "cancel_requested") {
        setActionText("Waiting for other party to confirm cancellation")
      }
    } catch {
      // Keep realtime listener resilient; no UI interruption needed here.
    } finally {
      isConfirmingCancelRef.current = false
    }
  }, [postMutualCancel, router])

  useEffect(() => {
    const channel = supabase.channel(`transaction:${transactionId}`)

    channelRef.current = channel

    channel
      .on("broadcast", { event: "mutual_cancel" }, () => {
        void confirmMutualCancelFromEvent()
      })
      .on("broadcast", { event: "code_validated" }, () =>
        redirectForEvent("code_validated"),
      )
      .on("broadcast", { event: "dispute_filed" }, () =>
        redirectForEvent("dispute_filed"),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `id=eq.${transactionId}`,
        },
        (payload) => {
          const nextStatus = (payload.new as { status?: string | null })?.status

          if (nextStatus === "refunded") {
            router.replace("/home")
          } else if (nextStatus === "completed") {
            redirectForEvent("code_validated")
          } else if (nextStatus === "disputed") {
            redirectForEvent("dispute_filed")
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "disputes",
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => redirectForEvent("dispute_filed"),
      )
      .subscribe()

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }

      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current)
      }

      channelRef.current = null
    }
  }, [
    confirmMutualCancelFromEvent,
    redirectForEvent,
    router,
    supabase,
    transactionId,
  ])

  const handleSellerCodeSubmit = useCallback(
    async (code: string) => {
      if (!isSeller || sellerIsLocked || isValidating) {
        return
      }

      setIsValidating(true)
      setErrorText(null)
      setActionText(null)
      setSellerIsError(false)
      setSellerIsCorrect(false)

      try {
        const response = await fetch(
          `/api/transactions/${transactionId}/validate-code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          },
        )

        const result = (await response.json().catch(() => ({}))) as ValidateCodeResponse

        if (
          response.ok &&
          result.success &&
          result.transaction?.status === "completed"
        ) {
          setSellerIsCorrect(true)
          setAttemptsRemaining(undefined)

          await broadcastEvent("code_validated")

          setActionText("Code verified. Completing handoff...")

          setTimeout(() => {
            router.replace(`/rating/${transactionId}`)
          }, 1500)

          return
        }

        if (result.error === "invalid_code") {
          setSellerIsError(true)
          setAttemptsRemaining(result.attempts_remaining)

          setTimeout(() => setSellerIsError(false), 450)

          return
        }

        if (result.error === "locked_out") {
          setSellerIsLocked(true)
          setAttemptsRemaining(0)
          setErrorText("Too many attempts. Contact support.")

          return
        }

        setErrorText("Unable to validate code.")
      } catch {
        setErrorText("Network error while validating code.")
      } finally {
        setIsValidating(false)
      }
    },
    [
      broadcastEvent,
      isSeller,
      isValidating,
      router,
      sellerIsLocked,
      transactionId,
    ],
  )

  const handleMutualCancel = async () => {
    if (isSubmittingCancel) {
      return
    }

    setIsSubmittingCancel(true)
    setErrorText(null)
    setActionText(null)

    try {
      const { response, result } = await postMutualCancel("initiate")

      if (result.error === "not_authorized") {
        showToast("You are not authorized to cancel this transaction")
        return
      }

      if (!response.ok) {
        setErrorText("Unable to cancel transaction.")
        return
      }

      if (result.success && result.status === "cancel_requested") {
        setActionText("Waiting for other party to confirm cancellation")

        await broadcastEvent("mutual_cancel", {
          status: "cancel_requested",
        })

        return
      }

      if (result.success && result.status === "cancelled") {
        await broadcastEvent("mutual_cancel", {
          status: "cancelled",
        })

        router.replace("/home")
        return
      }

      setErrorText("Unable to cancel transaction.")
    } catch {
      setErrorText("Network error while cancelling transaction.")
    } finally {
      setIsSubmittingCancel(false)
    }
  }

  const handleRaiseIssue = async () => {
    if (isSubmittingIssue) {
      return
    }

    setIsSubmittingIssue(true)
    setErrorText(null)
    setActionText(null)

    try {
      const response = await fetch(
        `/api/transactions/${transactionId}/raise-issue`,
        {
          method: "POST",
        },
      )

      const result = (await response.json().catch(() => ({}))) as ActionApiResponse

      if (!response.ok || !result.success) {
        setErrorText(result.error ?? "Unable to raise issue.")
        return
      }

      setActionText(result.message ?? "Issue raised.")

      await broadcastEvent("dispute_filed")

      setTimeout(() => redirectForEvent("dispute_filed"), 500)
    } catch {
      setErrorText("Network error while raising issue.")
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] pb-8 text-[#F5F5F5]">
      {/* Header */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto flex max-w-[1140px] items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#686D72] transition-colors duration-200 hover:text-[#E5FF00]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>

          <span className="text-[10px] uppercase tracking-[0.25em] text-[#686D72]">
            DRENZ / LIVE TRANSACTION
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1140px] px-4 pt-8 md:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            MEETUP
          </h1>

          <p className="mt-1 text-sm text-[#969696]">
            Secure handoff &middot; Complete the transaction in person
          </p>
        </div>

        {loading ? (
          /* Loading skeleton */
          <div className="lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div className="space-y-6">
              <div className="animate-pulse space-y-3">
                <div className="h-2 w-24 rounded bg-[#292929]" />
                <div className="h-4 w-40 rounded bg-[#292929]" />
                <div className="h-2.5 w-56 rounded bg-[#292929]" />
              </div>

              <div className="h-32 w-full animate-pulse rounded-xl bg-[#292929]" />

              <div className="space-y-2">
                <div className="h-11 w-full animate-pulse rounded-xl bg-[#292929]" />
                <div className="h-11 w-full animate-pulse rounded-xl bg-[#292929]" />
              </div>
            </div>

            <div className="mt-6 space-y-4 lg:mt-0">
              <div className="h-36 w-full animate-pulse rounded-xl bg-[#292929]" />
              <div className="h-2 w-48 animate-pulse rounded bg-[#292929]" />
            </div>
          </div>
        ) : errorText && !transaction ? (
          /* Full error state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#686D72"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-5 opacity-25"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#686D72]">
              MEETUP UNAVAILABLE
            </p>

            <p className="text-sm text-[#969696]">{errorText}</p>
          </div>
        ) : transaction ? (
          <div className="lg:grid lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            {/* LEFT COLUMN */}
            <div>
              {isBuyer ? (
                <>
                  {/* Buyer handoff */}
                  <div>
                    <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                      BUYER / HANDOFF
                    </span>

                    <h2 className="text-lg font-bold tracking-tight">
                      SHOW YOUR HANDOFF CODE
                    </h2>

                    <p className="mt-1 text-sm text-[#969696]">
                      Show this code to the seller during meetup.
                    </p>

                    <div className="mt-6">
                      <HandoffCode
                        role="buyer"
                        code={transaction.handoffCode ?? undefined}
                      />
                    </div>
                  </div>

                  {/* Buyer secondary actions */}
                  <div className="mt-8 border-t border-[#292929] pt-6">
                    <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                      ACTIONS
                    </span>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleMutualCancel}
                        disabled={isSubmittingCancel}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#292929] bg-[#151515] text-[11px] font-semibold tracking-[0.06em] text-[#BFC3C7] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>

                        {isSubmittingCancel ? "Cancelling..." : "Mutually Cancel"}
                      </button>

                      <button
                        type="button"
                        onClick={handleRaiseIssue}
                        disabled={isSubmittingIssue}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#3d1a1a] bg-[#2a1215] text-[11px] font-semibold tracking-[0.06em] text-[#e55555] transition-all duration-200 hover:bg-[#351518] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>

                        {isSubmittingIssue ? "Submitting..." : "Raise Issue"}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Seller handoff */}
                  <div>
                    <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                      SELLER / HANDOFF
                    </span>

                    <h2 className="text-lg font-bold tracking-tight">
                      VERIFY BUYER CODE
                    </h2>

                    <p className="mt-1 text-sm text-[#969696]">
                      Ask the buyer for the 4-digit code to complete handoff.
                    </p>

                    <div className="mt-6">
                      <HandoffCode
                        role="seller"
                        onSubmit={(code) => void handleSellerCodeSubmit(code)}
                        isCorrect={sellerIsCorrect}
                        isError={sellerIsError}
                        isLocked={sellerIsLocked}
                        attemptsRemaining={attemptsRemaining}
                      />

                      {sellerIsLocked ? (
                        <p className="mt-3 text-center text-sm font-semibold text-[#e55555]">
                          Too many attempts. Contact support.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Seller secondary actions */}
                  <div className="mt-8 border-t border-[#292929] pt-6">
                    <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                      ACTIONS
                    </span>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleMutualCancel}
                        disabled={isSubmittingCancel}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#292929] bg-[#151515] text-[11px] font-semibold tracking-[0.06em] text-[#BFC3C7] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>

                        {isSubmittingCancel ? "Cancelling..." : "Mutually Cancel"}
                      </button>

                      <button
                        type="button"
                        onClick={handleRaiseIssue}
                        disabled={isSubmittingIssue}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#3d1a1a] bg-[#2a1215] text-[11px] font-semibold tracking-[0.06em] text-[#e55555] transition-all duration-200 hover:bg-[#351518] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>

                        {isSubmittingIssue ? "Submitting..." : "Raise Issue"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error */}
              {errorText ? (
                <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#e55555"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>

                  <p className="text-sm text-[#e55555]">{errorText}</p>
                </div>
              ) : null}

              {/* Action / status */}
              {actionText ? (
                <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[#292929] bg-[#111111] p-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#969696"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>

                  <p className="text-sm text-[#BFC3C7]">{actionText}</p>
                </div>
              ) : null}
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="mt-8 self-start lg:sticky lg:top-8 lg:mt-0">
              <div className="rounded-xl border border-[#292929] bg-[#111111] p-5">
                <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                  TRANSACTION WINDOW
                </span>

                <CountdownTimer expiresAt={expiryAt} />

                <p className="mt-4 text-[11px] leading-relaxed text-[#686D72]">
                  Complete the handoff before the transaction window expires.
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-[#292929] bg-[#111111] p-5">
                <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                  TRANSACTION
                </span>

                <p className="truncate text-[11px] text-[#969696]">
                  ID: {transaction.id}
                </p>

                <p className="mt-1 text-[11px] text-[#686D72]">
                  Role: {isBuyer ? "Buyer" : "Seller"}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Toast */}
      {toastMessage ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto flex w-fit items-center gap-2 rounded-lg bg-[#E5FF00] px-4 py-2.5 text-sm font-semibold text-[#080808] shadow-[0_4px_24px_rgba(229,255,0,0.2)]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>

          {toastMessage}
        </div>
      ) : null}
    </main>
  )
}