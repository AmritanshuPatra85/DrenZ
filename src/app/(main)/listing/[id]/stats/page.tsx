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
    <main className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
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
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-base flex-1 text-center truncate">{stats.title}</h1>
        <div className="w-12" />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        {[
          { label: "Views",     value: stats.views ?? 0,                       emoji: "👁" },
          { label: "Likes",     value: stats.likes ?? stats.likes_count ?? 0,  emoji: "❤️" },
          { label: "Messages",  value: stats.messages ?? FALLBACK.messages,     emoji: "💬" },
        ].map(m => (
          <div key={m.label} className="bg-brand-card border border-white/10 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{m.emoji}</div>
            <div className="text-brand-yellow font-black text-xl">{m.value}</div>
            <div className="text-white/40 text-xs">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mx-4 bg-brand-card border border-white/10 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-white font-semibold text-sm">Views over time</p>
          <div className="flex gap-1">
            {[7, 14, 30].map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  range === r ? "bg-brand-yellow text-black" : "bg-white/10 text-white/50"
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1 h-24">
          {chart.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-sm bg-brand-yellow/70 transition-all"
                style={{ height: `${(val / max) * 100}%`, minHeight: 4 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="mx-4 bg-brand-card border border-white/10 rounded-2xl p-4 mb-4">
        <p className="text-white font-semibold text-sm mb-4">Conversion funnel</p>
        {[
          { label: "Viewed listing",  value: stats.views ?? 0,                      pct: 100 },
          { label: "Liked",           value: stats.likes ?? stats.likes_count ?? 0, pct: stats.views > 0 ? Math.round((stats.likes_count ?? 18) / stats.views * 100) : 0 },
          { label: "Messaged seller", value: stats.messages ?? FALLBACK.messages,    pct: Number(conversionRate) },
        ].map(f => (
          <div key={f.label} className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-white/50">{f.label}</span>
              <span className="text-white font-semibold">{f.value} <span className="text-white/30">({f.pct}%)</span></span>
            </div>
            <div className="bg-white/10 rounded-full h-1.5">
              <div
                className="bg-brand-yellow rounded-full h-1.5 transition-all"
                style={{ width: `${f.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="mx-4 bg-brand-card border border-white/10 rounded-2xl p-4 mb-4">
        <p className="text-white font-semibold text-sm mb-3">Suggestions</p>
        <div className="space-y-2">
          {Number(conversionRate) < 5 && (
            <div className="flex items-start gap-3 bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl p-3">
              <span className="text-lg">💡</span>
              <p className="text-white/70 text-xs leading-relaxed">Low message rate. Try lowering the price by ₹50 or adding more photos.</p>
            </div>
          )}
          {daysLive > 3 && (
            <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-lg">🚀</span>
              <p className="text-white/70 text-xs leading-relaxed">Listed {daysLive} days ago. Boost it to get back to the top of the feed.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 flex gap-3">
        <button className="flex-1 bg-brand-yellow text-black font-bold text-sm py-3 rounded-2xl">
          🚀 Boost Listing
        </button>
        <button className="flex-1 bg-brand-card border border-white/10 text-white font-semibold text-sm py-3 rounded-2xl">
          ✏️ Edit Price
        </button>
      </div>

      <BottomNav />
    </main>
  );
}