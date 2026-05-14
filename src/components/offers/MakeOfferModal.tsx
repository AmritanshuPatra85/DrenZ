"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type CreatedOffer = {
  id: string
  conversation_id?: string | null
  amount?: number | null
  note?: string | null
  status?: string | null
}

type MakeOfferModalProps = {
  conversationId: string
  listingPrice: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onOfferCreated?: (offer: CreatedOffer) => void
}

type OfferApiResponse = {
  offer?: CreatedOffer
  error?: string
}

const formatPrice = (value: number) => `₹${new Intl.NumberFormat("en-IN").format(value)}`

export function MakeOfferModal({
  conversationId,
  listingPrice,
  open,
  onOpenChange,
  trigger,
  onOfferCreated,
}: MakeOfferModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [amountInput, setAmountInput] = useState(listingPrice.toString())
  const [noteInput, setNoteInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  const isControlled = typeof open === "boolean"
  const isOpen = isControlled ? open : internalOpen
  const parsedAmount = useMemo(() => Number(amountInput), [amountInput])
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setAmountInput(listingPrice.toString())
    setNoteInput("")
    setErrorText(null)
  }, [isOpen, listingPrice])

  const submitOffer = async () => {
    if (!isAmountValid || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorText(null)

    try {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          amount: parsedAmount,
          note: noteInput.trim() || null,
        }),
      })

      const result = (await response.json().catch(() => ({}))) as OfferApiResponse

      if (!response.ok) {
        setErrorText(result.error ?? "Failed to submit offer.")
        return
      }

      if (result.offer) {
        onOfferCreated?.(result.offer)
      }

      handleOpenChange(false)
    } catch {
      setErrorText("Network error while submitting offer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-brand-yellow text-black hover:bg-brand-yellow/90">
            Make Offer
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="border-[#F5A6234D] bg-brand-card text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Make Offer</DialogTitle>
          <DialogDescription className="text-white/70">
            Start from listing price {formatPrice(listingPrice)} and send your offer.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Offer amount
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={amountInput}
              onChange={(event) => setAmountInput(event.target.value)}
              placeholder="Enter amount"
              className="h-10 border-white/15 bg-brand-card text-white placeholder:text-white/40 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/25"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-white/70">
              Note (optional)
            </label>
            <Input
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              placeholder="Any details for the seller"
              maxLength={180}
              className="h-10 border-white/15 bg-brand-card text-white placeholder:text-white/40 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/25"
            />
          </div>

          {errorText && <p className="text-xs text-red-300">{errorText}</p>}
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            onClick={submitOffer}
            disabled={!isAmountValid || isSubmitting}
            className="w-full bg-brand-yellow text-black hover:bg-brand-yellow/90 disabled:opacity-60 sm:w-auto"
          >
            {isSubmitting ? "Sending..." : "Send Offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
