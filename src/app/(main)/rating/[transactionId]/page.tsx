"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import BottomNav from "@/components/BottomNav"

const QUICK_TAGS = [
  "Great condition", "Exactly as described", "Fast response",
  "Easy meetup", "Trustworthy", "Would buy again",
  "Poor condition", "Late to meetup", "Unresponsive",
]

export default function RatingPage() {
  const router = useRouter()
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (stars === 0) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    const isFive = stars === 5
    const isMid = stars >= 3

    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-[#E5FF00]/10 border border-[#E5FF00]/20 flex items-center justify-center">
              {isFive ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ) : isMid ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 00-6 0v4" />
                  <path d="M5 9h14a1 1 0 011 1v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9a1 1 0 011-1z" />
                  <path d="M9 21v-6a2 2 0 014 0v6" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              )}
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-1">
            {isFive ? "Amazing Exchange" : isMid ? "Exchange Complete" : "Thank You"}
          </h2>
          <p className="text-sm text-[#969696] mb-8">
            Your feedback keeps DrenZ trustworthy.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="w-full h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
          >
            BACK TO HOME
          </button>
        </div>
      </main>
    )
  }

  const starLabels = ["Tap to rate", "Poor", "Fair", "Good", "Great", "Amazing! 🎉"]
  const active = hovered || stars

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-32">
      {/* ── Header ── */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / TRANSACTION
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-8 md:px-8">
        {/* ── Title ── */}
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            RATE THE<br className="sm:hidden" /> EXCHANGE
          </h1>
          <p className="mt-1 text-sm text-[#969696]">How did the exchange go?</p>
        </div>

        {/* ── Star rating ── */}
        <div>
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-5">
            YOUR RATING
          </span>
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(star => {
              const isLit = active >= star
              return (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setStars(star)}
                  className="transition-transform duration-150 hover:scale-110 active:scale-95"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill={isLit ? "#E5FF00" : "none"}
                    stroke={isLit ? "#E5FF00" : "#686D72"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-200"
                    style={{
                      filter: isLit ? "drop-shadow(0 0 8px rgba(229,255,0,0.25))" : "none",
                      opacity: isLit ? 1 : 0.35,
                    }}
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              )
            })}
          </div>
          <p className="text-center text-xs text-[#686D72] transition-all duration-200">
            {starLabels[stars]}
          </p>
        </div>

        {/* ── Quick tags ── */}
        {stars > 0 && (
          <div className="mt-8">
            <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
              QUICK FEEDBACK
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map(tag => {
                const isActive = tags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-[#E5FF00] text-[#080808]"
                        : "bg-[#111111] border border-[#292929] text-[#969696] hover:border-[#686D72]/30 hover:text-[#BFC3C7]"
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Comment ── */}
        {stars > 0 && (
          <div className="mt-8">
            <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
              YOUR TAKE{" "}
              <span className="font-normal tracking-normal text-[#686D72]/60">(Optional)</span>
            </span>
            <textarea
              placeholder="Tell others about this exchange…"
              value={comment}
              onChange={e => {
                if (e.target.value.length <= 140) setComment(e.target.value)
              }}
              rows={3}
              className="w-full bg-[#111111] border border-[#292929] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#686D72] outline-none resize-none transition-colors duration-200 focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
            />
            <p className="text-[11px] text-[#686D72] text-right mt-1.5">
              {comment.length}/140
            </p>
          </div>
        )}
      </div>

      {/* ── Submit footer ── */}
      <div className="fixed bottom-12 left-0 right-0 z-40">
        <div className="mx-auto max-w-lg px-4 md:px-8">
          <div className="bg-[#080808]/95 backdrop-blur-md border-t border-[#292929] pt-3 pb-2">
            <button
              onClick={handleSubmit}
              disabled={stars === 0 || loading}
              className={`group w-full flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-semibold tracking-[0.1em] transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                stars > 0
                  ? "bg-[#E5FF00] text-[#080808] hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)]"
                  : "bg-[#292929] text-[#686D72]"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  SUBMITTING
                </span>
              ) : (
                <>
                  SUBMIT RATING
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
            <button
              onClick={() => router.push("/home")}
              className="w-full text-center text-[11px] text-[#686D72] py-2 transition-colors duration-200 hover:text-[#969696]"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  )
}