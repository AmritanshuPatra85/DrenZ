"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

type CheckoutPageProps = {
  params: {
    listingId: string
  }
}

type ListingSummary = {
  id: string
  title: string
  price: number
  imageUrl: string | null
  sellerAlias: string
}

type CreateOrderResponse = {
  order_id?: string
  key?: string
  amount?: number
  currency?: string
  transactionId?: string
  error?: string
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayFailureResponse = {
  error?: {
    code?: string
    description?: string
    reason?: string
  }
}

type RazorpayInstance = {
  open: () => void
  on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void
}

type RazorpayOptions = {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  handler: (response: RazorpaySuccessResponse) => void
  modal?: {
    ondismiss?: () => void
  }
  theme?: {
    color?: string
  }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const PROTECTION_FEE = 10

const formatINR = (amount: number) => `Rs.${new Intl.NumberFormat("en-IN").format(amount)}`

const getReadableRazorpayError = (response: RazorpayFailureResponse) => {
  const detail =
    response.error?.description ?? response.error?.reason ?? response.error?.code
  return detail ?? "Payment failed. Please try again."
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { listingId } = params
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [listing, setListing] = useState<ListingSummary | null>(null)
  const [loadingListing, setLoadingListing] = useState(true)
  const [buyerProtection, setBuyerProtection] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [listingError, setListingError] = useState<string | null>(null)
  const [animateTotal, setAnimateTotal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const protectionFee = buyerProtection ? PROTECTION_FEE : 0
  const itemPrice = listing?.price ?? 0
  const totalPrice = itemPrice + protectionFee

  useEffect(() => {
    const loadListing = async () => {
      setLoadingListing(true)
      setListingError(null)

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images, seller:users!listings_seller_id_fkey(alias)")
        .eq("id", listingId)
        .maybeSingle()

      if (error || !data) {
        setListing(null)
        setListingError("Could not load listing details.")
        setLoadingListing(false)
        return
      }

      const seller = Array.isArray(data.seller) ? data.seller[0] : data.seller

      setListing({
        id: data.id,
        title: data.title,
        price: data.price,
        imageUrl: data.images?.[0] ?? null,
        sellerAlias: seller?.alias ?? "Seller",
      })
      setLoadingListing(false)
    }

    void loadListing()
  }, [listingId, supabase])

  useEffect(() => {
    setAnimateTotal(true)
    const timer = setTimeout(() => setAnimateTotal(false), 280)
    return () => clearTimeout(timer)
  }, [buyerProtection])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const ensureRazorpayScript = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false
    }

    if (window.Razorpay) {
      return true
    }

    return await new Promise((resolve) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      )

      if (existingScript) {
        const waitForExisting = () => resolve(Boolean(window.Razorpay))
        existingScript.addEventListener("load", waitForExisting, { once: true })
        existingScript.addEventListener("error", () => resolve(false), { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => resolve(Boolean(window.Razorpay))
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }, [])

  const handlePaymentSuccess = useCallback(
    (transactionId: string) => {
      setShowConfetti(true)
      setPaymentError(null)
      redirectTimeoutRef.current = setTimeout(() => {
        router.push(`/pre-meetup/${transactionId}`)
      }, 1300)
    },
    [router]
  )

  const handlePayNow = async () => {
    if (!listing || !termsAccepted || isPaying) {
      return
    }

    setIsPaying(true)
    setPaymentError(null)

    try {
      const orderResponse = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          buyerProtection,
        }),
      })

      const orderResult = (await orderResponse.json().catch(() => ({}))) as CreateOrderResponse

      if (!orderResponse.ok) {
        setPaymentError(orderResult.error ?? "Unable to create payment order.")
        return
      }

      const orderId = orderResult.order_id
      const key = orderResult.key
      const transactionId = orderResult.transactionId

      if (!orderId || !key || !transactionId) {
        setPaymentError("Payment setup is incomplete. Please try again.")
        return
      }

      const scriptLoaded = await ensureRazorpayScript()
      if (!scriptLoaded || !window.Razorpay) {
        setPaymentError("Could not load Razorpay checkout. Please try again.")
        return
      }

      const razorpay = new window.Razorpay({
        key,
        order_id: orderId,
        amount: typeof orderResult.amount === "number" ? orderResult.amount : totalPrice * 100,
        currency: orderResult.currency ?? "INR",
        name: "drenZ",
        description: listing.title,
        handler: () => {
          handlePaymentSuccess(transactionId)
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false)
          },
        },
        theme: {
          color: "#F5A623",
        },
      })

      razorpay.on("payment.failed", (failureResponse) => {
        setPaymentError(getReadableRazorpayError(failureResponse))
        setIsPaying(false)
      })

      razorpay.open()
    } catch {
      setPaymentError("Network error while starting payment.")
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-brand-dark px-3 pb-8 pt-5 text-white sm:px-4">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-xl font-bold">Checkout</h1>
        <p className="mt-1 text-sm text-white/70">Secure your item and complete payment safely.</p>

        <Card className="mt-4 border-white/10 bg-brand-card p-3 sm:p-4">
          {loadingListing ? (
            <p className="py-6 text-center text-sm text-white/60">Loading listing...</p>
          ) : listingError ? (
            <p className="py-6 text-center text-sm text-red-300">{listingError}</p>
          ) : listing ? (
            <div className="flex items-start gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/20">
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[11px] text-white/60">
                    No image
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-white">{listing.title}</p>
                <p className="mt-1 text-xs text-white/60">Sold by {listing.sellerAlias}</p>
                <p className="mt-2 text-lg font-bold text-brand-yellow">{formatINR(listing.price)}</p>
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">Buyer Protection</p>
              <p className="text-xs text-white/60">Covers payment disputes and support (+{formatINR(PROTECTION_FEE)}).</p>
            </div>
            <Switch
              checked={buyerProtection}
              onCheckedChange={setBuyerProtection}
              aria-label="Toggle buyer protection"
              className="data-[state=checked]:bg-brand-yellow"
            />
          </div>
        </Card>

        <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-white">Price breakdown</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between text-white/85">
              <span>Item price</span>
              <span>{formatINR(itemPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-white/85">
              <span>Buyer protection</span>
              <span className={`transition-all duration-300 ${animateTotal ? "scale-105 text-brand-yellow" : ""}`}>
                {formatINR(protectionFee)}
              </span>
            </div>
            <div className="h-px bg-white/10" />
            <div
              className={`flex items-center justify-between text-base font-bold transition-all duration-300 ${
                animateTotal ? "scale-[1.02] text-brand-yellow" : "text-white"
              }`}
            >
              <span>Total</span>
              <span>{formatINR(totalPrice)}</span>
            </div>
          </div>
        </Card>

        <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
          <label className="flex items-start gap-2">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              aria-label="Accept terms and conditions"
              className="mt-0.5"
            />
            <span className="text-sm text-white/80">
              I agree to the terms and conditions, and understand this payment is final once meetup is confirmed.
            </span>
          </label>
        </Card>

        {paymentError ? (
          <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {paymentError}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={handlePayNow}
          disabled={!termsAccepted || !listing || isPaying || loadingListing || showConfetti}
          className="mt-4 h-11 w-full bg-brand-yellow text-base font-bold text-black hover:bg-brand-yellow/90 disabled:opacity-60"
        >
          {isPaying ? "Opening payment..." : `Pay Now ${formatINR(totalPrice)}`}
        </Button>
      </div>

      {showConfetti ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="absolute h-2 w-2 rounded-sm bg-brand-yellow confetti-piece"
              style={{
                left: `${(index % 8) * 12 + 6}%`,
                top: "-10px",
                animationDelay: `${(index % 7) * 80}ms`,
                animationDuration: `${1800 + (index % 5) * 180}ms`,
                opacity: 0.95,
              }}
            />
          ))}
        </div>
      ) : null}

      <style jsx>{`
        .confetti-piece {
          animation-name: confetti-fall;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(-20px, 110vh, 0) rotate(540deg);
          }
        }
      `}</style>
    </main>
  )
}
