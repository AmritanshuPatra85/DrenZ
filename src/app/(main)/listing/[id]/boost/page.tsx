"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const BOOST_OPTIONS = [
  {
    id: "24hr",
    duration: "24 Hours",
    price: 19,
    badge: "⚡ Popular",
    perks: ["Top of feed for 24hrs", "Gold boost badge on listing", "Push to all category browsers"],
  },
  {
    id: "48hr",
    duration: "48 Hours",
    price: 39,
    badge: "🔥 Best Value",
    perks: ["Top of feed for 48hrs", "Gold boost badge on listing", "Push to all category browsers", "Featured in drenZ picks"],
  },
];

export default function BoostListing() {
  const { id }     = useParams();
  const router     = useRouter();
  const [selected, setSelected] = useState("48hr");
  const [loading,  setLoading]  = useState(false);
  const [boosted,  setBoosted]  = useState(false);

  const option = BOOST_OPTIONS.find(o => o.id === selected)!;

  const handleBoost = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setBoosted(true);
  };

  if (boosted) return (
    <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">🚀</div>
      <h2 className="text-white font-black text-2xl mb-2">Listing Boosted!</h2>
      <p className="text-white/50 text-sm mb-2">Your listing is now at the top of the feed.</p>
      <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl px-6 py-3 mb-8">
        <p className="text-brand-yellow font-bold text-sm">⚡ Active for {option.duration}</p>
      </div>
      <button
        onClick={() => router.push(`/listing/${id}`)}
        className="bg-brand-yellow text-black font-bold px-8 py-4 rounded-2xl w-full"
      >
        View Listing →
      </button>
    </main>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-32">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">Boost Listing</h1>
        <div className="w-12" />
      </div>

      {/* Explainer */}
      <div className="mx-4 mb-5 bg-brand-yellow/10 border border-brand-yellow/20 rounded-2xl p-4">
        <p className="text-brand-yellow font-bold text-sm mb-1">🚀 What is Boost?</p>
        <p className="text-white/60 text-xs leading-relaxed">Boosting pins your listing to the top of the home feed and search results, giving it maximum visibility to active buyers on campus.</p>
      </div>

      {/* Options */}
      <div className="px-4 space-y-3 mb-6">
        {BOOST_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelected(opt.id)}
            className={`w-full text-left rounded-2xl border p-4 transition-colors ${
              selected === opt.id
                ? "bg-brand-yellow/10 border-brand-yellow"
                : "bg-brand-card border-white/10"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selected === opt.id ? "border-brand-yellow" : "border-white/30"
                }`}>
                  {selected === opt.id && <div className="w-2 h-2 rounded-full bg-brand-yellow" />}
                </div>
                <span className="text-white font-bold text-sm">{opt.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded-full">{opt.badge}</span>
                <span className="text-brand-yellow font-black text-lg">₹{opt.price}</span>
              </div>
            </div>
            <div className="space-y-1 ml-6">
              {opt.perks.map(perk => (
                <p key={perk} className="text-white/50 text-xs">✓ {perk}</p>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Preview badge */}
      <div className="mx-4 mb-6">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">Badge preview</p>
        <div className="bg-brand-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-yellow/20 rounded-xl flex items-center justify-center text-2xl">👕</div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Your Listing Title</p>
            <p className="text-brand-yellow text-xs font-bold">₹349</p>
          </div>
          <span className="bg-brand-yellow text-black text-[9px] font-black px-2 py-1 rounded-full">⚡ BOOSTED</span>
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3 bg-brand-dark border-t border-white/5">
        <button
          onClick={handleBoost}
          disabled={loading}
          className="w-full bg-brand-yellow text-black font-bold text-base py-4 rounded-2xl disabled:opacity-50"
        >
          {loading ? "Processing…" : `Boost for ₹${option.price} →`}
        </button>
        <p className="text-center text-white/30 text-xs mt-2">Powered by Razorpay · Secure payment</p>
      </div>

      <BottomNav />
    </main>
  );
}