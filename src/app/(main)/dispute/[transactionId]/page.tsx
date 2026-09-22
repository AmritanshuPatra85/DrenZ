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
        className: "border-[#E5FF00]/30 bg-[#E5FF00]/[0.04] text-[#E5FF00]",
      }
    }
    if (status === "closed") {
      return {
        label: "Escalated",
        className: "border-[#3d1a1a] bg-[#2a1215] text-[#e55555]",
      }
    }
    return {
      label: "Under Review",
      className: "border-[#292929] bg-[#151515] text-[#BFC3C7]",
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
    <main className="min-h-screen bg-[#080808] px-3 pb-8 pt-5 text-[#F5F5F5] sm:px-4">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
          DRENZ / TRANSACTION
        </p>
        <h1 className="mt-1 text-xl font-bold text-[#F5F5F5]">DISPUTE CENTER</h1>
        <p className="mt-1 text-sm text-[#969696]">
          Submit evidence or track your dispute status.
        </p>

        {loading ? (
          <Card className="mt-4 border-[#292929] bg-[#111111] p-6 animate-pulse">
            <div className="h-3 w-32 bg-[#292929] rounded mx-auto" />
          </Card>
        ) : errorText && !transaction ? (
          <Card className="mt-4 border-[#3d1a1a] bg-[#2a1215] p-6">
            <p className="text-center text-sm text-[#e55555]">{errorText}</p>
          </Card>
        ) : transaction ? (
          <>
            {!detailMode ? (
              <div className="mt-4 space-y-3">
                <Card className="border-[#292929] bg-[#111111] p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#686D72]">
                    Photo Comparison
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-[#292929] bg-[#080808] p-2">
                      <p className="mb-2 text-xs text-[#686D72]">Listing photo</p>
                      <div className="aspect-square overflow-hidden rounded-lg bg-[#080808]">
                        {transaction.listing.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={transaction.listing.imageUrl}
                            alt={transaction.listing.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#292929] bg-[#080808] p-2">
                      <p className="mb-2 text-xs text-[#686D72]">Actual item photo</p>
                      <label className="block cursor-pointer">
                        <div className="aspect-square overflow-hidden rounded-lg border border-dashed border-[#292929] bg-[#080808] transition-colors duration-200 hover:border-[#686D72]/40">
                          {uploadPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={uploadPreview}
                              alt="Uploaded evidence"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center gap-2 px-3">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              <span className="text-xs text-[#686D72]">Tap to upload</span>
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

                <Card className="border-[#292929] bg-[#111111] p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#686D72]">
                    Dispute Category
                  </p>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2 border-[#292929] bg-[#080808] text-[#F5F5F5] focus-visible:border-[#E5FF00]/30 focus-visible:ring-[#E5FF00]/20">
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

                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#686D72]">
                    Description
                  </p>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe what went wrong..."
                    className="mt-2 min-h-28 border-[#292929] bg-[#080808] text-[#F5F5F5] placeholder-[#686D72] focus-visible:border-[#E5FF00]/30 focus-visible:ring-[#E5FF00]/20"
                  />

                  <label className="mt-4 flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={confirmed}
                      onCheckedChange={(checked) => setConfirmed(checked === true)}
                      className="mt-0.5 data-[state=checked]:bg-[#E5FF00] data-[state=checked]:border-[#E5FF00]"
                    />
                    <span className="text-sm text-[#BFC3C7]">
                      I confirm this information is accurate
                    </span>
                  </label>

                  <Button
                    type="button"
                    onClick={submitDispute}
                    disabled={!confirmed || !category || description.trim().length < 10 || isSubmitting}
                    className="mt-4 w-full bg-[#E5FF00] text-[#080808] hover:bg-[#F2FF4A] disabled:opacity-60"
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

                <Card className="border-[#292929] bg-[#111111] p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#686D72]">
                    Evidence
                  </p>
                  {transaction.dispute?.evidence?.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {transaction.dispute.evidence.map((evidenceUrl, index) => (
                        <div key={index} className="overflow-hidden rounded-lg border border-[#292929] bg-[#080808]">
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
                    <p className="mt-2 text-sm text-[#969696]">No evidence photos submitted.</p>
                  )}
                </Card>

                <Card className="border-[#292929] bg-[#111111] p-3 sm:p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#686D72]">
                    Timeline
                  </p>
                  <div className="mt-3 space-y-3">
                    {timeline.map((event, index) => (
                      <div key={`${event.label}-${index}`} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#E5FF00]" />
                        <div>
                          <p className="text-sm text-[#F5F5F5]">{event.label}</p>
                          <p className="text-xs text-[#969696]">{toReadableDate(event.at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {transaction.dispute?.resolutionNote ? (
                  <Card className="border-[#292929] bg-[#111111] p-3 sm:p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#686D72]">
                      Resolution Notes
                    </p>
                    <p className="mt-2 text-sm text-[#BFC3C7]">
                      {transaction.dispute.resolutionNote}
                    </p>
                  </Card>
                ) : null}
              </div>
            )}
          </>
        ) : null}

        {errorText && transaction ? (
          <p className="mt-3 rounded-xl border border-[#3d1a1a] bg-[#2a1215] px-3 py-2 text-sm text-[#e55555]">
            {errorText}
          </p>
        ) : null}

        {successText ? (
          <p className="mt-3 rounded-xl border border-[#E5FF00]/20 bg-[#E5FF00]/[0.04] px-3 py-2 text-sm text-[#E5FF00]">
            {successText}
          </p>
        ) : null}
      </div>
    </main>
  )
}