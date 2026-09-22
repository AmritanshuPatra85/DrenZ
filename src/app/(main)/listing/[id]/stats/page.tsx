"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";

const FALLBACK = {
  title: "H&M Oversized Hoodie",
  price: 349,
  views: 124,
  likes: 18,
  messages: 9,
  created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  chart: [12, 24, 18, 31, 22, 28, 34, 29, 18, 24, 31, 22, 19, 28],
};

export default function ListingStats() {
  const { id }   = useParams();
  const router   = useRouter();
  const [stats,  setStats]  = useState<any>(null);
  const [range,  setRange]  = useState(7);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("listings")
        .select("title, price, views, likes_count, created_at")
        .eq("id", id)
        .single();

      setStats(data ?? FALLBACK);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      {/* Header skeleton */}
      <div className="border-b border-[#292929]">
        <div className="mx-auto max-w-[1080px] flex items-center justify-between px-4 py-5 md:px-8">
          <div className="h-2 w-12 bg-[#292929] rounded animate-pulse" />
          <div className="h-2 w-32 bg-[#292929] rounded animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-[1080px] px-4 pt-8 md:px-8">
        {/* Title skeleton */}
        <div className="h-5 w-48 bg-[#292929] rounded animate-pulse mb-2" />
        <div className="h-3 w-20 bg-[#292929] rounded animate-pulse mb-8" />
        {/* Metrics skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#111111] border border-[#292929] rounded-xl p-4 text-center animate-pulse">
              <div className="h-5 w-12 bg-[#292929] rounded mx-auto mb-2" />
              <div className="h-2 w-16 bg-[#292929] rounded mx-auto" />
            </div>
          ))}
        </div>
        {/* Chart skeleton */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-4 mb-4 animate-pulse">
          <div className="h-3 w-32 bg-[#292929] rounded mb-4" />
          <div className="h-24 w-full bg-[#292929] rounded" />
        </div>
        {/* Funnel skeleton */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-4 mb-4 animate-pulse">
          <div className="h-3 w-36 bg-[#292929] rounded mb-4" />
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-3">
              <div className="h-2 w-32 bg-[#292929] rounded mb-1.5" />
              <div className="h-1.5 w-full bg-[#292929] rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );

  const chart = FALLBACK.chart.slice(0, range);
  const max   = Math.max(...chart);

  const daysLive = Math.floor(
    (Date.now() - new Date(stats.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  const conversionRate = stats.views > 0
    ? ((stats.messages ?? FALLBACK.messages) / stats.views * 100).toFixed(1)
    : "0.0";

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-24">
      {/* ── Header ── */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-[1080px] flex items-center justify-between px-4 py-5 md:px-8">
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
            DRENZ / LISTING STATS
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1080px] px-4 pt-8 md:px-8">
        {/* ── Title + price ── */}
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight truncate">{stats.title}</h1>
          <p className="text-sm font-bold text-[#E5FF00] mt-1">₹{stats.price}</p>
        </div>

        {/* ── Metrics ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Views",    value: stats.views ?? 0,                       icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )},
            { label: "Likes",    value: stats.likes ?? stats.likes_count ?? 0,  icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            )},
            { label: "Messages", value: stats.messages ?? FALLBACK.messages,     icon: (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
            )},
          ].map(m => (
            <div key={m.label} className="bg-[#111111] border border-[#292929] rounded-xl p-4 text-center">
              <div className="flex justify-center mb-2 text-[#686D72]">{m.icon}</div>
              <div className="text-lg font-bold text-[#E5FF00]">{m.value}</div>
              <div className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* ── Chart ── */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase">
              Views Over Time
            </span>
            <div className="flex gap-1">
              {[7, 14, 30].map(r => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors duration-200 ${
                    range === r
                      ? "bg-[#E5FF00] text-[#080808]"
                      : "bg-[#151515] border border-[#292929] text-[#686D72] hover:text-[#BFC3C7] hover:border-[#686D72]/30"
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-px bg-[#292929]" />
              ))}
            </div>
            <div className="relative flex items-end gap-[3px] h-24">
              {chart.map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-sm bg-[#E5FF00]/60 transition-all duration-300 hover:bg-[#E5FF00]/80"
                    style={{ height: `${(val / max) * 100}%`, minHeight: 4 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Conversion funnel ── */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-4 mb-4">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-5">
            Conversion Funnel
          </span>
          {[
            { label: "Viewed listing",  value: stats.views ?? 0,                      pct: 100 },
            { label: "Liked",           value: stats.likes ?? stats.likes_count ?? 0, pct: stats.views > 0 ? Math.round((stats.likes_count ?? 18) / stats.views * 100) : 0 },
            { label: "Messaged seller", value: stats.messages ?? FALLBACK.messages,    pct: Number(conversionRate) },
          ].map(f => (
            <div key={f.label} className="mb-4 last:mb-0">
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="text-[#969696] tracking-wide">{f.label}</span>
                <span className="text-[#F5F5F5] font-semibold">
                  {f.value} <span className="text-[#686D72] font-normal">({f.pct}%)</span>
                </span>
              </div>
              <div className="bg-[#292929] rounded-full h-1">
                <div
                  className="bg-[#E5FF00] rounded-full h-1 transition-all duration-500"
                  style={{ width: `${f.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ── Suggestions ── */}
        <div className="bg-[#111111] border border-[#292929] rounded-xl p-4 mb-6">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-4">
            Suggestions
          </span>
          <div className="space-y-2">
            {Number(conversionRate) < 5 && (
              <div className="flex items-start gap-3 bg-[#E5FF00]/[0.04] border border-[#E5FF00]/15 rounded-lg p-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E5FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-[12px] text-[#BFC3C7] leading-relaxed">
                  Low message rate. Try lowering the price by ₹50 or adding more photos.
                </p>
              </div>
            )}
            {daysLive > 3 && (
              <div className="flex items-start gap-3 bg-[#151515] border border-[#292929] rounded-lg p-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-[12px] text-[#BFC3C7] leading-relaxed">
                  Listed {daysLive} days ago. Boost it to get back to the top of the feed.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-2">
          <button className="group flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            BOOST LISTING
          </button>
          <button className="group flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.08em] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5] active:scale-[0.98]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            EDIT PRICE
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}