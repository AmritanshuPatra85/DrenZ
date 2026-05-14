"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type DisputePageProps = {
  params: {
    transactionId: string
  }
}

type TransactionDispute = {
  id: string
  category: string
  status: "open" | "under_review" | "resolved" | "closed" | null
  evidence: string[]
  resolutionNote: string | null
  createdAt: string | null
}

type TransactionPayload = {
  id: string
  createdAt: string | null
  listing: {
    title: string
    imageUrl: string | null
  }
  dispute: TransactionDispute | null
}

type TransactionApiResponse = {
  transaction?: TransactionPayload
  error?: string
}

type SubmitDisputeResponse = {
  success?: boolean
  dispute?: TransactionDispute
  error?: string
}

const CATEGORIES = [
  "Wrong item",
  "Not as described",
  "Item damaged",
  "No show",
] as const

const toReadableDate = (value: string | null) => {
  if (!value) {
    return "Unknown time"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown time"
  }
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default function DisputePage({ params }: DisputePageProps) {
  const { transactionId } = params

  const [transaction, setTransaction] = useState<TransactionPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [successText, setSuccessText] = useState<string | null>(null)

  const [category, setCategory] = useState<string>("")
  const [description, setDescription] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
          setTransaction(null)
          setErrorText(result.error ?? "Failed to load transaction.")
          return
        }

        setTransaction(result.transaction)
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        setTransaction(null)
        setErrorText("Network error while loading dispute.")
      } finally {
        setLoading(false)
      }
    }

    void loadTransaction()

    return () => controller.abort()
  }, [transactionId])

  const detailMode = Boolean(transaction?.dispute)

  const statusMeta = useMemo(() => {
    const status = transaction?.dispute?.status
    if (status === "resolved") {
      return {
        label: "Resolved",
        className: "border-green-400/40 bg-green-500/15 text-green-200",
      }
    }
    if (status === "closed") {
      return {
        label: "Escalated",
        className: "border-red-400/40 bg-red-500/15 text-red-200",
      }
    }
    return {
      label: "Under Review",
      className: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    }
  }, [transaction?.dispute?.status])

  const timeline = useMemo(() => {
    if (!transaction?.dispute) {
      return []
    }
    const createdAt = transaction.dispute.createdAt
    const entries = [
      { label: "Dispute filed", at: createdAt },
      { label: statusMeta.label, at: createdAt },
    ]
    return entries
  }, [statusMeta.label, transaction?.dispute])

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setUploadPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setUploadPreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const submitDispute = async () => {
    if (!transaction || isSubmitting) {
      return
    }
    if (!category || description.trim().length < 10 || !confirmed) {
      setErrorText("Please complete all required fields.")
      return
    }

    setIsSubmitting(true)
    setErrorText(null)
    setSuccessText(null)

    try {
      const response = await fetch(`/api/transactions/${transaction.id}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category,
          description: description.trim(),
          evidence: uploadPreview ? [uploadPreview] : [],
        }),
      })

      const result = (await response.json().catch(() => ({}))) as SubmitDisputeResponse
      if (!response.ok || !result.success || !result.dispute) {
        setErrorText(result.error ?? "Failed to submit dispute.")
        return
      }

      setTransaction((previous) =>
        previous
          ? {
              ...previous,
              dispute: result.dispute ?? null,
            }
          : previous
      )
      setSuccessText("Dispute submitted successfully.")
    } catch {
      setErrorText("Network error while submitting dispute.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-dark px-3 pb-8 pt-5 text-white sm:px-4">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-xl font-bold text-white">Dispute Center</h1>
        <p className="mt-1 text-sm text-white/60">
          Submit evidence or track your dispute status.
        </p>

        {loading ? (
          <Card className="mt-4 border-white/10 bg-brand-card p-6">
            <p className="text-center text-sm text-white/60">Loading transaction...</p>
          </Card>
        ) : errorText && !transaction ? (
          <Card className="mt-4 border-red-400/40 bg-red-500/10 p-6">
            <p className="text-center text-sm text-red-200">{errorText}</p>
          </Card>
        ) : transaction ? (
          <>
            {!detailMode ? (
              <div className="mt-4 space-y-3">
                <Card className="border-white/10 bg-brand-card p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Photo Comparison
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-black/10 p-2">
                      <p className="mb-2 text-xs text-white/60">Listing photo</p>
                      <div className="aspect-square overflow-hidden rounded-lg bg-brand-dark">
                        {transaction.listing.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={transaction.listing.imageUrl}
                            alt={transaction.listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-white/50">
                            No photo
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/10 p-2">
                      <p className="mb-2 text-xs text-white/60">Actual item photo</p>
                      <label className="block cursor-pointer">
                        <div className="aspect-square overflow-hidden rounded-lg border border-dashed border-white/20 bg-brand-dark">
                          {uploadPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={uploadPreview}
                              alt="Uploaded evidence"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-white/50">
                              Tap to upload
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                  </div>
                </Card>

                <Card className="border-white/10 bg-brand-card p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Dispute Category
                  </p>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2 border-white/10 bg-brand-dark text-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((entry) => (
                        <SelectItem key={entry} value={entry}>
                          {entry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-white/60">
                    Description
                  </p>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe what went wrong..."
                    className="mt-2 min-h-28 border-white/10 bg-brand-dark text-white placeholder:text-white/40 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/30"
                  />

                  <label className="mt-4 flex items-start gap-2">
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={(checked) => setConfirmed(checked === true)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-white/80">
                      I confirm this information is accurate
                    </span>
                  </label>

                  <Button
                    type="button"
                    onClick={submitDispute}
                    disabled={!confirmed || !category || description.trim().length < 10 || isSubmitting}
                    className="mt-4 w-full bg-brand-yellow text-black hover:bg-brand-yellow/90 disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Dispute"}
                  </Button>
                </Card>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <Card className={`border p-3 sm:p-4 ${statusMeta.className}`}>
                  <p className="text-sm font-semibold">{statusMeta.label}</p>
                </Card>

                <Card className="border-white/10 bg-brand-card p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Evidence
                  </p>
                  {transaction.dispute?.evidence?.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {transaction.dispute.evidence.map((evidenceUrl, index) => (
                        <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-brand-dark">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={evidenceUrl}
                            alt={`Evidence ${index + 1}`}
                            className="aspect-square h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-white/60">No evidence photos submitted.</p>
                  )}
                </Card>

                <Card className="border-white/10 bg-brand-card p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                    Timeline
                  </p>
                  <div className="mt-3 space-y-3">
                    {timeline.map((event, index) => (
                      <div key={`${event.label}-${index}`} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-yellow" />
                        <div>
                          <p className="text-sm text-white">{event.label}</p>
                          <p className="text-xs text-white/60">{toReadableDate(event.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {transaction.dispute?.resolutionNote ? (
                  <Card className="border-white/10 bg-brand-card p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                      Resolution Notes
                    </p>
                    <p className="mt-2 text-sm text-white/85">
                      {transaction.dispute.resolutionNote}
                    </p>
                  </Card>
                ) : null}
              </div>
            )}
          </>
        ) : null}

        {errorText && transaction ? (
          <p className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorText}
          </p>
        ) : null}

        {successText ? (
          <p className="mt-3 rounded-xl border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-200">
            {successText}
          </p>
        ) : null}
      </div>
    </main>
  )
}
