"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import BottomNav from "@/components/BottomNav"

const BOOST_OPTIONS = [
  {
    id: "24hr",
    duration: "24 Hours",
    price: 19,
    badge: "⚡ Popular",
    perks: [
      "Top of feed for 24hrs",
      "Gold boost badge on listing",
      "Push to all category browsers",
    ],
  },
  {
    id: "48hr",
    duration: "48 Hours",
    price: 39,
    badge: "🔥 Best Value",
    perks: [
      "Top of feed for 48hrs",
      "Gold boost badge on listing",
      "Push to all category browsers",
      "Featured in drenZ picks",
    ],
  },
]

export default function BoostListing() {
  const { id } = useParams()
  const router = useRouter()
  const [selected, setSelected] = useState("48hr")
  const [loading, setLoading] = useState(false)
  const [boosted, setBoosted] = useState(false)

  const option = BOOST_OPTIONS.find((o) => o.id === selected)!

  const handleBoost = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setBoosted(true)
  }

  if (boosted) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto w-full max-w-sm">
          <p className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase mb-10">
            DRENZ / BOOST
          </p>

          <div className="mb-6 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-[#E5FF00]/10 border border-[#E5FF00]/20 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#E5FF00"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight mb-1">
            BOOST ACTIVE
          </h2>

          <p className="text-sm text-[#969696] mb-6">
            Your listing is now at the top of the feed.
          </p>

          <div className="bg-[#111111] border border-[#E5FF00]/20 rounded-xl px-5 py-3 mb-8 inline-block">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#E5FF00] uppercase">
              Active for {option.duration}
            </p>
          </div>

          <button
            onClick={() => router.push(`/listing/${id}`)}
            className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
          >
            VIEW LISTING

            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-32">
      {/* Header */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
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

          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / BOOST
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-8 md:px-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            BOOST YOUR LISTING
          </h1>

          <p className="mt-1 text-sm text-[#969696]">
            Increase visibility to active campus buyers.
          </p>
        </div>

        {/* Explainer */}
        <div className="flex items-start gap-3 bg-[#E5FF00]/[0.04] border border-[#E5FF00]/15 rounded-xl p-4 mb-8">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E5FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 mt-0.5"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>

          <div>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-[#E5FF00] uppercase mb-1">
              What is Boost?
            </p>

            <p className="text-[12px] text-[#BFC3C7] leading-relaxed">
              Boosting pins your listing to the top of the home feed and search
              results, giving it maximum visibility to active buyers on campus.
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="mb-8">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
            Select Duration
          </span>

          <div className="space-y-2">
            {BOOST_OPTIONS.map((opt) => {
              const isSelected = selected === opt.id

              return (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "bg-[#E5FF00]/[0.04] border-[#E5FF00]/30"
                      : "bg-[#111111] border-[#292929] hover:border-[#686D72]/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          isSelected
                            ? "border-[#E5FF00]"
                            : "border-[#686D72]/40"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#E5FF00]" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-bold text-[#F5F5F5]">
                          {opt.duration}
                        </p>

                        <p className="text-[9px] font-semibold tracking-[0.12em] text-[#686D72] uppercase mt-0.5">
                          {opt.badge.replace(/[⚡🔥]\s*/, "")}
                        </p>
                      </div>
                    </div>

                    <p className="text-lg font-bold text-[#E5FF00]">
                      ₹{opt.price}
                    </p>
                  </div>

                  <div className="space-y-1.5 ml-7">
                    {opt.perks.map((perk) => (
                      <div key={perk} className="flex items-start gap-2">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#E5FF00"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 mt-px"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>

                        <p className="text-[11px] text-[#969696] leading-snug">
                          {perk}
                        </p>
                      </div>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Badge preview */}
        <div className="mb-6">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
            Badge Preview
          </span>

          <div className="bg-[#111111] border border-[#292929] rounded-xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-[#151515] border border-[#292929] rounded-lg flex items-center justify-center shrink-0">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#686D72"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#F5F5F5] truncate">
                Your Listing Title
              </p>

              <p className="text-xs font-bold text-[#E5FF00] mt-0.5">
                ₹349
              </p>
            </div>

            <span className="shrink-0 text-[9px] font-bold tracking-[0.12em] text-[#080808] bg-[#E5FF00] px-2 py-1 rounded uppercase">
              Boosted
            </span>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-12 left-0 right-0 z-40">
        <div className="mx-auto max-w-2xl px-4 md:px-8">
          <div className="bg-[#080808]/95 backdrop-blur-md border-t border-[#292929] pt-3 pb-2">
            <button
              onClick={handleBoost}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-spin"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      strokeDasharray="32 20"
                    />
                  </svg>
                  PROCESSING
                </span>
              ) : (
                <>
                  BOOST FOR ₹{option.price}

                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-[#686D72] mt-2 tracking-wide">
              Powered by Razorpay · Secure payment
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}