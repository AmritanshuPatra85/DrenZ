"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
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
  error?: {
    code?: string
    description?: string
    reason?: string
  }
}

type RazorpayInstance = {
  open: () => void
  on: (
    event: string,
    callback: (response: RazorpayFailureResponse) => void
  ) => void
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

const DELIVERY_FEE = 10

const formatINR = (amount: number) =>
  `₹${new Intl.NumberFormat("en-IN").format(amount)}`

const getReadableRazorpayError = (
  response: RazorpayFailureResponse
) =>
  response.error?.description ??
  response.error?.reason ??
  response.error?.code ??
  "Payment failed. Please try again."

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path
        d="M8 10V7a4 4 0 018 0v3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="m9 18 6-6-6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function CheckoutPage({
  params,
}: CheckoutPageProps) {
  const { listingId } = params

  const router = useRouter()

  const supabase = useMemo(() => createClient(), [])

  const redirectTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null)

  const [listing, setListing] =
    useState<ListingSummary | null>(null)

  const [loadingListing, setLoadingListing] =
    useState(true)

  const [useDelivery, setUseDelivery] =
    useState(false)

  const [deliveryAddress, setDeliveryAddress] =
    useState("")

  const [termsAccepted, setTermsAccepted] =
    useState(false)

  const [isPaying, setIsPaying] =
    useState(false)

  const [paymentError, setPaymentError] =
    useState<string | null>(null)

  const [listingError, setListingError] =
    useState<string | null>(null)

  const [animateTotal, setAnimateTotal] =
    useState(false)

  const [showConfetti, setShowConfetti] =
    useState(false)

  const deliveryFee = useDelivery ? DELIVERY_FEE : 0

  const itemPrice = listing?.price ?? 0

  const totalPrice = itemPrice + deliveryFee

  useEffect(() => {
    const loadListing = async () => {
      setLoadingListing(true)
      setListingError(null)

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, title, price, images, seller:users!listings_seller_id_fkey(alias)"
        )
        .eq("id", listingId)
        .maybeSingle()

      if (error || !data) {
        setListingError("Could not load listing details.")
        setLoadingListing(false)
        return
      }

      const seller = Array.isArray(data.seller)
        ? data.seller[0]
        : data.seller

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

    const timer = setTimeout(() => {
      setAnimateTotal(false)
    }, 280)

    return () => clearTimeout(timer)
  }, [useDelivery])

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const ensureRazorpayScript =
    useCallback(async (): Promise<boolean> => {
      if (typeof window === "undefined") {
        return false
      }

      if (window.Razorpay) {
        return true
      }

      return new Promise((resolve) => {
        const existing =
          document.querySelector<HTMLScriptElement>(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
          )

        if (existing) {
          existing.addEventListener(
            "load",
            () => resolve(Boolean(window.Razorpay)),
            { once: true }
          )

          existing.addEventListener(
            "error",
            () => resolve(false),
            { once: true }
          )

          return
        }

        const script = document.createElement("script")

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js"

        script.async = true

        script.onload = () =>
          resolve(Boolean(window.Razorpay))

        script.onerror = () => resolve(false)

        document.body.appendChild(script)
      })
    }, [])

  const handlePaymentSuccess = useCallback(
    (response: RazorpaySuccessResponse) => {
      setShowConfetti(true)
      setPaymentError(null)

      redirectTimeoutRef.current = setTimeout(() => {
        router.push(
          `/orders/${response.razorpay_order_id}`
        )
      }, 1300)
    },
    [router]
  )

  const handlePayNow = async () => {
    if (!listing || !termsAccepted || isPaying) {
      return
    }

    if (useDelivery && !deliveryAddress.trim()) {
      setPaymentError(
        "Please enter your delivery address."
      )
      return
    }

    setIsPaying(true)
    setPaymentError(null)

    try {
      const orderResponse = await fetch(
        "/api/checkout/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listing_id: listingId,
            use_delivery: useDelivery,
            delivery_address: useDelivery
              ? deliveryAddress.trim()
              : null,
          }),
        }
      )

      const orderResult =
        (await orderResponse
          .json()
          .catch(() => ({}))) as CreateOrderResponse

      if (!orderResponse.ok) {
        setPaymentError(
          orderResult.error ??
            "Unable to create payment order."
        )
        return
      }

      const orderId = orderResult.order_id

      const key = orderResult.razorpay_key

      if (!orderId || !key) {
        setPaymentError(
          "Payment setup is incomplete. Please try again."
        )
        return
      }

      const scriptLoaded =
        await ensureRazorpayScript()

      if (!scriptLoaded || !window.Razorpay) {
        setPaymentError(
          "Could not load Razorpay checkout. Please try again."
        )
        return
      }

      const razorpay = new window.Razorpay({
        key,
        order_id: orderId,
        amount:
          typeof orderResult.amount === "number"
            ? orderResult.amount
            : totalPrice * 100,
        currency: orderResult.currency ?? "INR",
        name: "drenZ",
        description: listing.title,

        handler: (response) => {
          handlePaymentSuccess(response)
        },

        modal: {
          ondismiss: () => {
            setIsPaying(false)
          },
        },

        theme: {
          color: "#E5FF00",
        },
      })

      razorpay.on(
        "payment.failed",
        (failureResponse) => {
          setPaymentError(
            getReadableRazorpayError(
              failureResponse
            )
          )

          setIsPaying(false)
        }
      )

      razorpay.open()
    } catch {
      setPaymentError(
        "Network error while starting payment."
      )
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="border-b border-[#292929] pb-5">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[#969696] transition-colors hover:text-[#F5F5F5]"
            >
              <ArrowLeftIcon />
              <span>Back</span>
            </button>

            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#E5FF00]">
                DRENZ
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#686D72]">
                Secure checkout
              </p>
            </div>
          </div>
        </header>

        {/* PAGE TITLE */}
        <section className="py-8 sm:py-10">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#686D72]">
            PURCHASE
          </p>

          <h1 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl">
            CHECKOUT
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#969696]">
            Complete your purchase securely. Meet the seller on
            campus and confirm the handoff through drenZ.
          </p>
        </section>

        {/* MAIN GRID */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
          {/* LEFT */}
          <div className="space-y-6">
            {/* LISTING */}
            <section className="border-y border-[#292929]">
              <div className="flex items-center justify-between border-b border-[#292929] py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#686D72]">
                  YOUR ITEM
                </p>

                <span className="text-[10px] uppercase tracking-[0.18em] text-[#686D72]">
                  01
                </span>
              </div>

              {loadingListing ? (
                <div className="flex gap-4 py-6">
                  <div className="h-28 w-24 shrink-0 animate-pulse rounded-lg bg-[#151515]" />

                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#151515]" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-[#151515]" />
                    <div className="h-5 w-24 animate-pulse rounded bg-[#151515]" />
                  </div>
                </div>
              ) : listingError ? (
                <div className="py-8">
                  <p className="text-sm text-red-300">
                    {listingError}
                  </p>
                </div>
              ) : listing ? (
                <div className="flex gap-4 py-6">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-[#151515]">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center text-[9px] uppercase tracking-[0.12em] text-[#686D72]">
                        No image
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-px bg-[#E5FF00]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#686D72]">
                      LISTING
                    </p>

                    <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-tight tracking-[-0.02em]">
                      {listing.title}
                    </h2>

                    <p className="mt-2 text-xs text-[#969696]">
                      Sold by{" "}
                      <span className="text-[#BFC3C7]">
                        @{listing.sellerAlias}
                      </span>
                    </p>

                    <p className="mt-4 text-lg font-black text-[#E5FF00]">
                      {formatINR(listing.price)}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>

            {/* DELIVERY */}
            <section className="border-b border-[#292929] pb-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#686D72]">
                    DELIVERY
                  </p>

                  <h2 className="mt-2 text-lg font-bold">
                    Campus delivery
                  </h2>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={useDelivery}
                  aria-label="Toggle campus delivery"
                  onClick={() => {
                    setUseDelivery((current) => {
                      const next = !current

                      if (!next) {
                        setDeliveryAddress("")
                      }

                      return next
                    })
                  }}
                  className={`relative h-7 w-12 rounded-full border transition-colors ${
                    useDelivery
                      ? "border-[#E5FF00] bg-[#E5FF00]"
                      : "border-[#292929] bg-[#151515]"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
                      useDelivery
                        ? "left-6 bg-[#080808]"
                        : "left-1 bg-[#686D72]"
                    }`}
                  />
                </button>
              </div>

              <p className="max-w-xl text-sm leading-6 text-[#969696]">
                Get your purchase delivered to your hostel
                instead of meeting the seller in person.
              </p>

              <div className="mt-3 flex items-center justify-between border border-[#292929] bg-[#111111] px-3 py-3">
                <span className="text-xs uppercase tracking-[0.14em] text-[#686D72]">
                  Delivery fee
                </span>

                <span className="text-sm font-semibold text-[#F5F5F5]">
                  {formatINR(DELIVERY_FEE)}
                </span>
              </div>

              {useDelivery && (
                <div className="mt-4">
                  <label
                    htmlFor="delivery-address"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#686D72]"
                  >
                    HOSTEL / ROOM
                  </label>

                  <input
                    id="delivery-address"
                    type="text"
                    placeholder="e.g. HS-4, Room 210"
                    value={deliveryAddress}
                    onChange={(event) =>
                      setDeliveryAddress(
                        event.target.value
                      )
                    }
                    className="h-12 w-full border border-[#292929] bg-[#111111] px-4 text-sm text-[#F5F5F5] outline-none transition-colors placeholder:text-[#686D72] focus:border-[#E5FF00]"
                  />
                </div>
              )}
            </section>

            {/* TERMS */}
            <section className="border-b border-[#292929] pb-6">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center border ${
                    termsAccepted
                      ? "border-[#E5FF00] bg-[#E5FF00] text-[#080808]"
                      : "border-[#292929] bg-[#111111] text-[#686D72]"
                  }`}
                >
                  {termsAccepted ? (
                    <CheckIcon />
                  ) : (
                    <LockIcon />
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#686D72]">
                    SECURE PAYMENT
                  </p>

                  <h2 className="mt-1 text-base font-bold">
                    Confirm your purchase
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setTermsAccepted(
                    (current) => !current
                  )
                }
                className="flex w-full items-start gap-3 text-left"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border ${
                    termsAccepted
                      ? "border-[#E5FF00] bg-[#E5FF00] text-[#080808]"
                      : "border-[#686D72] bg-transparent"
                  }`}
                >
                  {termsAccepted && (
                    <CheckIcon />
                  )}
                </span>

                <span className="text-sm leading-6 text-[#969696]">
                  I agree to the terms and conditions
                  and understand that the payment is
                  final once the meetup is confirmed.
                </span>
              </button>
            </section>

            {/* PAYMENT NOTE */}
            <div className="flex gap-3 border border-[#292929] bg-[#111111] p-4">
              <div className="mt-0.5 shrink-0 text-[#E5FF00]">
                <LockIcon />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#BFC3C7]">
                  SECURED BY RAZORPAY
                </p>

                <p className="mt-1 text-xs leading-5 text-[#686D72]">
                  Your payment is processed securely.
                  drenZ never stores your card or payment
                  credentials.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside className="lg:sticky lg:top-6">
            <section className="border border-[#292929] bg-[#111111]">
              <div className="border-b border-[#292929] px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#686D72]">
                  ORDER SUMMARY
                </p>
              </div>

              <div className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[#969696]">
                      Item
                    </span>

                    <span className="max-w-[180px] truncate text-right text-sm font-medium">
                      {loadingListing
                        ? "Loading..."
                        : listing
                          ? listing.title
                          : "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#969696]">
                      Item price
                    </span>

                    <span className="text-sm font-medium">
                      {formatINR(itemPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#969696]">
                      Delivery
                    </span>

                    <span
                      className={`text-sm font-medium transition-all duration-300 ${
                        animateTotal
                          ? "scale-105 text-[#E5FF00]"
                          : "text-[#F5F5F5]"
                      }`}
                    >
                      {useDelivery
                        ? formatINR(deliveryFee)
                        : "FREE"}
                    </span>
                  </div>
                </div>

                <div className="my-5 h-px bg-[#292929]" />

                <div
                  className={`flex items-end justify-between gap-4 transition-transform duration-300 ${
                    animateTotal
                      ? "scale-[1.02]"
                      : "scale-100"
                  }`}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#686D72]">
                      TOTAL
                    </p>

                    <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#E5FF00]">
                      {formatINR(totalPrice)}
                    </p>
                  </div>

                  <span className="pb-1 text-[10px] uppercase tracking-[0.16em] text-[#686D72]">
                    INR
                  </span>
                </div>

                {paymentError && (
                  <div className="mt-5 border border-red-400/30 bg-red-500/10 px-4 py-3">
                    <p className="text-xs leading-5 text-red-200">
                      {paymentError}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={
                    !termsAccepted ||
                    !listing ||
                    isPaying ||
                    loadingListing ||
                    showConfetti
                  }
                  className="group mt-5 flex h-14 w-full items-center justify-between bg-[#E5FF00] px-5 text-sm font-black uppercase tracking-[0.12em] text-[#080808] transition-all hover:bg-[#F2FF4A] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    {isPaying
                      ? "Opening payment..."
                      : "Pay securely"}
                  </span>

                  <span className="flex items-center gap-1 transition-transform group-hover:translate-x-1">
                    <ChevronRightIcon />
                  </span>
                </button>

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#686D72]">
                  <LockIcon />
                  <span>Encrypted payment</span>
                </div>
              </div>
            </section>

            <div className="mt-4 border-l-2 border-[#E5FF00] pl-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#686D72]">
                DRENZ HANDOFF
              </p>

              <p className="mt-2 text-xs leading-5 text-[#969696]">
                After successful payment, you&apos;ll be
                taken to your order where the meetup and
                handoff process begins.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* PAYMENT SUCCESS OVERLAY */}
      {showConfetti && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#080808]/20 backdrop-blur-[1px]" />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E5FF00] text-[#080808] shadow-[0_0_80px_rgba(229,255,0,0.25)]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                className="h-9 w-9"
              >
                <path
                  d="m5 12 4 4L19 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {Array.from({ length: 32 }).map(
            (_, index) => (
              <span
                key={index}
                className="absolute h-2 w-2 rounded-sm bg-[#E5FF00]"
                style={{
                  left: `${(index % 8) * 12 + 6}%`,
                  top: "-10px",
                  animationDelay: `${
                    (index % 7) * 80
                  }ms`,
                  animationDuration: `${
                    1800 + (index % 5) * 180
                  }ms`,
                  opacity: 0.95,
                  animation:
                    "confetti-fall ease-out forwards",
                }}
              />
            )
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -20px, 0)
              rotate(0deg);
          }

          100% {
            transform: translate3d(
                ${(Math.random() - 0.5) * 180}px,
                105vh,
                0
              )
              rotate(540deg);
          }
        }
      `}</style>
    </main>
  )
}