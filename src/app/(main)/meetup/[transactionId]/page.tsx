"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import CountdownTimer from "@/components/CountdownTimer"
import HandoffCode from "@/components/handoff/HandoffCode"
import { Button } from "@/components/ui/button"
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
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | undefined>(undefined)
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
    [router, transactionId]
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

  const broadcastEvent = useCallback(async (
    eventName: "mutual_cancel" | "code_validated" | "dispute_filed",
    payload?: Record<string, unknown>
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
  }, [transactionId])

  const postMutualCancel = useCallback(
    async (action: "initiate" | "confirm") => {
      const response = await fetch(`/api/transactions/${transactionId}/mutual-cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      })
      const result = (await response.json().catch(() => ({}))) as MutualCancelResponse
      return { response, result }
    },
    [transactionId]
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
      .on("broadcast", { event: "code_validated" }, () => redirectForEvent("code_validated"))
      .on("broadcast", { event: "dispute_filed" }, () => redirectForEvent("dispute_filed"))
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
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "disputes",
          filter: `transaction_id=eq.${transactionId}`,
        },
        () => redirectForEvent("dispute_filed")
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
  }, [confirmMutualCancelFromEvent, redirectForEvent, router, supabase, transactionId])

  const handleSellerCodeSubmit = useCallback(async (code: string) => {
    if (!isSeller || sellerIsLocked || isValidating) {
      return
    }

    setIsValidating(true)
    setErrorText(null)
    setActionText(null)
    setSellerIsError(false)
    setSellerIsCorrect(false)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/validate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
      const result = (await response.json().catch(() => ({}))) as ValidateCodeResponse

      if (response.ok && result.success && result.transaction?.status === "completed") {
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
  }, [
    broadcastEvent, isSeller, isValidating, router, sellerIsLocked, transactionId
  ])

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
        await broadcastEvent("mutual_cancel", { status: "cancel_requested" })
        return
      }

      if (result.success && result.status === "cancelled") {
        await broadcastEvent("mutual_cancel", { status: "cancelled" })
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
      const response = await fetch(`/api/transactions/${transactionId}/raise-issue`, {
        method: "POST",
      })
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
    <main className="min-h-screen bg-brand-dark px-3 pb-8 pt-5 text-white sm:px-4">
      <div className="mx-auto w-full max-w-xl">
        <CountdownTimer expiresAt={expiryAt} className="mb-4 rounded-2xl border border-white/10 bg-brand-card p-4" />

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-brand-card p-6 text-center text-sm text-white/60">
            Loading meetup details...
          </div>
        ) : errorText && !transaction ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center text-sm text-red-200">
            {errorText}
          </div>
        ) : transaction ? (
          <>
            {isBuyer ? (
              <section>
                <h1 className="text-lg font-bold text-white">Share This Handoff Code</h1>
                <p className="mt-1 text-sm text-white/60">
                  Show this code to the seller during meetup.
                </p>
                <div className="mt-4">
                  <HandoffCode role="buyer" code={transaction.handoffCode ?? undefined} />
                </div>

                <div className="mt-4 grid gap-2">
                  <Button
                    type="button"
                    onClick={handleMutualCancel}
                    disabled={isSubmittingCancel}
                    variant="secondary"
                    className="h-10 bg-brand-card text-white hover:bg-white/10"
                  >
                    {isSubmittingCancel ? "Cancelling..." : "Mutually Cancel"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleRaiseIssue}
                    disabled={isSubmittingIssue}
                    variant="destructive"
                    className="h-10"
                  >
                    {isSubmittingIssue ? "Submitting..." : "Raise Issue"}
                  </Button>
                </div>
              </section>
            ) : (
              <section>
                <h1 className="text-lg font-bold text-white">Enter Buyer Handoff Code</h1>
                <p className="mt-1 text-sm text-white/60">
                  Ask buyer for the 4-digit code to complete handoff.
                </p>

                <div className="mt-4">
                  <HandoffCode
                    role="seller"
                    onSubmit={(code) => void handleSellerCodeSubmit(code)}
                    isCorrect={sellerIsCorrect}
                    isError={sellerIsError}
                    isLocked={sellerIsLocked}
                    attemptsRemaining={attemptsRemaining}
                  />
                  {sellerIsLocked ? (
                    <p className="mt-2 text-center text-sm font-semibold text-red-300">
                      Too many attempts. Contact support.
                    </p>
                  ) : null}
                </div>
              </section>
            )}

            {errorText ? (
              <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorText}
              </p>
            ) : null}

            {actionText ? (
              <p className="mt-3 rounded-xl border border-green-400/30 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                {actionText}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {toastMessage ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-black shadow-lg">
          {toastMessage}
        </div>
      ) : null}
    </main>
  )
}
