"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type OfferRole = "SELLER" | "BUYER"
type OfferStatus = "pending" | "accepted" | "countered" | "rejected"

type AcceptOfferResponse = {
  updatedPrice?: number | null
  price?: number | null
  amount?: number | null
  offer?: {
    amount?: number | null
    status?: string | null
  } | null
  listing?: {
    price?: number | null
  } | null
  error?: string
}

type OfferCardProps = {
  id: string
  amount: number
  note?: string | null
  viewerRole: OfferRole
  status?: OfferStatus
  className?: string
  onAccept?: () => void
  onCounter?: () => void
  onAcceptedPriceChange?: (price: number) => void
}

const formatPrice = (value: number) => `₹${new Intl.NumberFormat("en-IN").format(value)}`

const resolveAcceptedPrice = (result: AcceptOfferResponse, fallbackAmount: number) => {
  if (typeof result.updatedPrice === "number") return result.updatedPrice
  if (typeof result.price === "number") return result.price
  if (typeof result.amount === "number") return result.amount
  if (typeof result.offer?.amount === "number") return result.offer.amount
  if (typeof result.listing?.price === "number") return result.listing.price
  return fallbackAmount
}

export function OfferCard({
  id,
  amount,
  note,
  viewerRole,
  status = "pending",
  className,
  onAccept,
  onCounter,
  onAcceptedPriceChange,
}: OfferCardProps) {
  const [currentStatus, setCurrentStatus] = useState<OfferStatus>(status)
  const [isAccepting, setIsAccepting] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const showSellerActions = viewerRole === "SELLER" && currentStatus === "pending"
  const pendingText = useMemo(() => {
    if (currentStatus === "accepted") return "Offer accepted"
    if (currentStatus === "countered") return "Counter offer sent"
    if (currentStatus === "rejected") return "Offer declined"
    return "Pending seller response"
  }, [currentStatus])

  const acceptOffer = async () => {
    if (isAccepting || currentStatus !== "pending") {
      return
    }

    setIsAccepting(true)
    setErrorText(null)

    try {
      const response = await fetch(`/api/offers/${id}/accept`, {
        method: "POST",
      })
      const result = (await response.json().catch(() => ({}))) as AcceptOfferResponse

      if (!response.ok) {
        setErrorText(result.error ?? "Failed to accept offer.")
        return
      }

      const nextPrice = resolveAcceptedPrice(result, amount)
      onAcceptedPriceChange?.(nextPrice)
      onAccept?.()
      setCurrentStatus("accepted")
    } catch {
      setErrorText("Network error while accepting offer.")
    } finally {
      setIsAccepting(false)
    }
  }

  return (
    <article
      className={cn(
        "w-full max-w-[92%] rounded-2xl border border-brand-yellow/30 bg-brand-card p-3 text-white sm:max-w-[86%]",
        className
      )}
    >
      <div className="inline-flex rounded-full bg-brand-yellow px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
        Offer
      </div>

      <p className="mt-2 text-2xl font-extrabold leading-tight text-brand-yellow sm:text-[1.75rem]">
        {formatPrice(amount)}
      </p>

      {note ? (
        <p className="mt-2 break-words text-sm leading-relaxed text-white/85">{note}</p>
      ) : null}

      {showSellerActions ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={acceptOffer}
            disabled={isAccepting}
            className="h-8 rounded-full bg-brand-yellow px-4 text-xs font-semibold text-black hover:bg-brand-yellow/90 disabled:opacity-60"
          >
            {isAccepting ? "Accepting..." : "Accept"}
          </Button>
          <Button
            type="button"
            onClick={() => onCounter?.()}
            variant="secondary"
            className="h-8 rounded-full bg-white/10 px-4 text-xs font-semibold text-white hover:bg-white/20"
          >
            Counter
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs font-semibold text-white/70">{pendingText}</p>
      )}

      {errorText ? <p className="mt-2 text-xs text-red-300">{errorText}</p> : null}
    </article>
  )
}
