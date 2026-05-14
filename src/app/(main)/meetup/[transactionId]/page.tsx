"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import CountdownTimer from "@/components/CountdownTimer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  valid?: boolean
  alreadyValidated?: boolean
  error?: string
}

type ActionApiResponse = {
  success?: boolean
  message?: string
  error?: string
}

const MAX_ATTEMPTS = 5

export default function MeetupPage({ params }: MeetupPageProps) {
  const { transactionId } = params
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [actionText, setActionText] = useState<string | null>(null)
  const [copyToast, setCopyToast] = useState(false)

  const [codeDigits, setCodeDigits] = useState(["", "", "", ""])
  const [isValidating, setIsValidating] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [validationState, setValidationState] = useState<"success" | "error" | null>(null)
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false)
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)

  const isSeller = transaction?.viewerRole === "seller"
  const isBuyer = transaction?.viewerRole === "buyer"
  const isLockedOut = failedAttempts >= MAX_ATTEMPTS

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

  const showCopiedToast = () => {
    setCopyToast(true)
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }
    toastTimerRef.current = setTimeout(() => setCopyToast(false), 1400)
  }

  const redirectForEvent = useCallback(
    (eventName: "mutual_cancel" | "code_validated" | "dispute_filed") => {
      if (eventName === "code_validated") {
        router.replace("/messages")
        return
      }

      if (eventName === "mutual_cancel") {
        router.replace(`/pre-meetup/${transactionId}`)
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

  useEffect(() => {
    const channel = supabase.channel(`transaction:${transactionId}`)
    channelRef.current = channel

    channel
      .on("broadcast", { event: "mutual_cancel" }, () => redirectForEvent("mutual_cancel"))
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
            redirectForEvent("mutual_cancel")
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
  }, [redirectForEvent, supabase, transactionId])

  useEffect(() => {
    if (isSeller && !isLockedOut) {
      inputRefs.current[0]?.focus()
    }
  }, [isSeller, isLockedOut])

  const broadcastEvent = useCallback(async (
    eventName: "mutual_cancel" | "code_validated" | "dispute_filed"
  ) => {
    if (!channelRef.current) {
      return
    }

    await channelRef.current.send({
      type: "broadcast",
      event: eventName,
      payload: {
        transactionId,
      },
    })
  }, [transactionId])

  const handleCodeChange = (index: number, value: string) => {
    if (isLockedOut || isValidating) {
      return
    }

    const digit = value.replace(/\D/g, "").slice(-1)
    setValidationState(null)
    setErrorText(null)

    setCodeDigits((previous) => {
      const next = [...previous]
      next[index] = digit
      return next
    })

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const validateCompletedCode = useCallback(async () => {
    if (!isSeller || isLockedOut || isValidating) {
      return
    }

    const code = codeDigits.join("")
    if (!/^\d{4}$/.test(code)) {
      return
    }

    setIsValidating(true)
    setErrorText(null)
    setActionText(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/validate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
      const result = (await response.json().catch(() => ({}))) as ValidateCodeResponse

      if (response.ok && (result.valid || result.alreadyValidated)) {
        setValidationState("success")
        await broadcastEvent("code_validated")
        setActionText("Code verified. Completing handoff...")
        setTimeout(() => redirectForEvent("code_validated"), 650)
        return
      }

      setValidationState("error")
      setFailedAttempts((previous) => Math.min(MAX_ATTEMPTS, previous + 1))
      setCodeDigits(["", "", "", ""])
      inputRefs.current[0]?.focus()
      setErrorText(result.error ?? "Incorrect code.")
    } catch {
      setErrorText("Network error while validating code.")
    } finally {
      setIsValidating(false)
      setTimeout(() => setValidationState(null), 420)
    }
  }, [
    broadcastEvent,
    codeDigits,
    isLockedOut,
    isSeller,
    isValidating,
    redirectForEvent,
    transactionId,
  ])

  useEffect(() => {
    if (!isSeller) {
      return
    }

    const complete = codeDigits.every((digit) => digit.length === 1)
    if (complete) {
      void validateCompletedCode()
    }
  }, [codeDigits, isSeller, validateCompletedCode])

  const handleCopyCode = async () => {
    if (!transaction?.handoffCode) {
      return
    }

    try {
      await navigator.clipboard.writeText(transaction.handoffCode)
      showCopiedToast()
    } catch {
      setErrorText("Unable to copy code. Please copy manually.")
    }
  }

  const handleMutualCancel = async () => {
    if (isSubmittingCancel) {
      return
    }
    setIsSubmittingCancel(true)
    setErrorText(null)
    setActionText(null)

    try {
      const response = await fetch(`/api/transactions/${transactionId}/mutual-cancel`, {
        method: "POST",
      })
      const result = (await response.json().catch(() => ({}))) as ActionApiResponse

      if (!response.ok || !result.success) {
        setErrorText(result.error ?? "Unable to cancel transaction.")
        return
      }

      setActionText(result.message ?? "Transaction cancelled.")
      await broadcastEvent("mutual_cancel")
      setTimeout(() => redirectForEvent("mutual_cancel"), 500)
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

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-brand-card p-6 text-center transition hover:border-brand-yellow/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/30"
                >
                  <p className="text-xs uppercase tracking-wider text-white/60">Tap to copy</p>
                  <p className="mt-2 font-mono text-5xl font-black tracking-[0.25em] text-brand-yellow">
                    {transaction.handoffCode ?? "----"}
                  </p>
                </button>

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

                <div
                  className={`mt-4 rounded-2xl border bg-brand-card p-4 transition ${
                    validationState === "success"
                      ? "border-green-400 flash-success"
                      : validationState === "error"
                        ? "border-red-400 shake-error"
                        : "border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {codeDigits.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(element) => {
                          inputRefs.current[index] = element
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(event) => handleCodeChange(index, event.target.value)}
                        onKeyDown={(event) => handleCodeKeyDown(index, event)}
                        disabled={isLockedOut || isValidating}
                        className="h-14 w-12 rounded-xl border-white/15 bg-brand-card px-0 text-center font-mono text-2xl font-bold text-brand-yellow focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/30 sm:w-14"
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-center text-xs text-white/60">
                    Attempts: {failedAttempts}/{MAX_ATTEMPTS}
                  </p>

                  {isLockedOut ? (
                    <p className="mt-2 text-center text-sm font-semibold text-red-300">
                      Too many failed attempts. Meetup is locked.
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

      {copyToast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-full bg-brand-yellow px-4 py-2 text-sm font-semibold text-black shadow-lg">
          Copied!
        </div>
      ) : null}

      <style jsx>{`
        .flash-success {
          animation: successFlash 420ms ease-out;
        }

        .shake-error {
          animation: shakeX 340ms ease-in-out;
        }

        @keyframes successFlash {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5);
          }
          100% {
            box-shadow: 0 0 0 12px rgba(74, 222, 128, 0);
          }
        }

        @keyframes shakeX {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </main>
  )
}
