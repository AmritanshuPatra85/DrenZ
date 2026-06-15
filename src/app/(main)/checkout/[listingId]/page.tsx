"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"

type CheckoutPageProps = {
  params: { listingId: string }
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
  razorpay_key?: string
  amount?: number
  currency?: string
  error?: string
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayFailureResponse = {
  error?: { code?: string; description?: string; reason?: string }
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
  modal?: { ondismiss?: () => void }
  theme?: { color?: string }
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const DELIVERY_FEE = 10
const formatINR = (amount: number) => `₹${new Intl.NumberFormat("en-IN").format(amount)}`
const getReadableRazorpayError = (response: RazorpayFailureResponse) =>
  response.error?.description ?? response.error?.reason ?? response.error?.code ?? "Payment failed. Please try again."

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const { listingId } = params
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [listing, setListing]               = useState<ListingSummary | null>(null)
  const [loadingListing, setLoadingListing] = useState(true)
  const [useDelivery, setUseDelivery]       = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [termsAccepted, setTermsAccepted]   = useState(false)
  const [isPaying, setIsPaying]             = useState(false)
  const [paymentError, setPaymentError]     = useState<string | null>(null)
  const [listingError, setListingError]     = useState<string | null>(null)
  const [animateTotal, setAnimateTotal]     = useState(false)
  const [showConfetti, setShowConfetti]     = useState(false)

  const deliveryFee = useDelivery ? DELIVERY_FEE : 0
  const itemPrice   = listing?.price ?? 0
  const totalPrice  = itemPrice + deliveryFee

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
  }, [useDelivery])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [])

  const ensureRazorpayScript = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false
    if (window.Razorpay) return true
    return new Promise((resolve) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      )
      if (existing) {
        existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true })
        existing.addEventListener("error", () => resolve(false), { once: true })
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

  const handlePaymentSuccess = useCallback((response: RazorpaySuccessResponse) => {
    setShowConfetti(true)
    setPaymentError(null)
    redirectTimeoutRef.current = setTimeout(() => {
      router.push(`/orders/${response.razorpay_order_id}`)
    }, 1300)
  }, [router])

  const handlePayNow = async () => {
    if (!listing || !termsAccepted || isPaying) return
    if (useDelivery && !deliveryAddress.trim()) {
      setPaymentError("Please enter your delivery address.")
      return
    }

    setIsPaying(true)
    setPaymentError(null)

    try {
      const orderResponse = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          use_delivery: useDelivery,
          delivery_address: useDelivery ? deliveryAddress.trim() : null,
        }),
      })

      const orderResult = (await orderResponse.json().catch(() => ({}))) as CreateOrderResponse

      if (!orderResponse.ok) {
        setPaymentError(orderResult.error ?? "Unable to create payment order.")
        return
      }

      const orderId = orderResult.order_id
      const key     = orderResult.razorpay_key

      if (!orderId || !key) {
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
        handler: (response) => { handlePaymentSuccess(response) },
        modal: { ondismiss: () => setIsPaying(false) },
        theme: { color: "#F5A623" },
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

        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
          <h1 className="text-xl font-bold flex-1">Checkout</h1>
        </div>

        <Card className="mt-4 border-white/10 bg-brand-card p-3 sm:p-4">
          {loadingListing ? (
            <p className="py-6 text-center text-sm text-white/60">Loading listing...</p>
          ) : listingError ? (
            <p className="py-6 text-center text-sm text-red-300">{listingError}</p>
          ) : listing ? (
            <div className="flex items-start gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/20">
                {listing.imageUrl ? (
                  <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
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
              <p className="text-sm font-semibold text-white">Campus Delivery</p>
              <p className="text-xs text-white/60">drenZ delivers to your hostel (+{formatINR(DELIVERY_FEE)}).</p>
            </div>
            <Switch
              checked={useDelivery}
              onCheckedChange={(val) => {
                setUseDelivery(val)
                if (!val) setDeliveryAddress("")
              }}
              aria-label="Toggle delivery"
              className="data-[state=checked]:bg-brand-yellow"
            />
          </div>

          {useDelivery && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Hostel block & room no. (e.g. HS-4, Room 210)"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-yellow"
              />
            </div>
          )}
        </Card>

        <Card className="mt-3 border-white/10 bg-brand-card p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-white">Price breakdown</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between text-white/85">
              <span>Item price</span>
              <span>{formatINR(itemPrice)}</span>
            </div>
            {useDelivery && (
              <div className="flex items-center justify-between text-white/85">
                <span>Campus delivery</span>
                <span className={`transition-all duration-300 ${animateTotal ? "scale-105 text-brand-yellow" : ""}`}>
                  {formatINR(deliveryFee)}
                </span>
              </div>
            )}
            <div className="h-px bg-white/10" />
            <div className={`flex items-center justify-between text-base font-bold transition-all duration-300 ${
              animateTotal ? "scale-[1.02] text-brand-yellow" : "text-white"
            }`}>
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

        {paymentError && (
          <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {paymentError}
          </p>
        )}

        <Button
          type="button"
          onClick={handlePayNow}
          disabled={!termsAccepted || !listing || isPaying || loadingListing || showConfetti}
          className="mt-4 h-11 w-full bg-brand-yellow text-base font-bold text-black hover:bg-brand-yellow/90 disabled:opacity-60"
        >
          {isPaying ? "Opening payment..." : `Pay Now ${formatINR(totalPrice)}`}
        </Button>
      </div>

      {showConfetti && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              key={index}
              className="absolute h-2 w-2 rounded-sm bg-brand-yellow"
              style={{
                left: `${(index % 8) * 12 + 6}%`,
                top: "-10px",
                animationDelay: `${(index % 7) * 80}ms`,
                animationDuration: `${1800 + (index % 5) * 180}ms`,
                opacity: 0.95,
                animation: "confetti-fall ease-out forwards",
              }}
            />
          ))}
        </div>
      )}
    </main>
  )
}