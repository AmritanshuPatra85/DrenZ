"use client";

import { useState } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

const CATEGORIES = [
  { label: "All",         emoji: ""   },
  { label: "Tops",        emoji: "👕" },
  { label: "Bottoms",     emoji: "👖" },
  { label: "Shoes",       emoji: "👟" },
  { label: "Bags",        emoji: "👜" },
  { label: "Accessories", emoji: "💍" },
];

const CARD_COLORS = ["#e8e4f0", "#e0f0e8", "#f0e8e8", "#f0f0e0", "#e0e8f0", "#f0e8f0"];

const CARD_EMOJIS: Record<string, string> = {
  "Tops": "👕", "Bottoms": "👖", "Shoes": "👟",
  "Bags": "👜", "Accessories": "💍", "Outerwear": "🧥",
};

const FALLBACK = [
  { id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M",   condition: "Good",     category: "Tops",        seller_alias: "shadow_panda", seller_dept: "CSE" },
  { id: "2", title: "Levi's 511 Jeans",     price: 599, size: "30",  condition: "Like New", category: "Bottoms",     seller_alias: "cool_tiger",   seller_dept: "ECE" },
  { id: "3", title: "Nike Tanjun Sneakers", price: 799, size: "9",   condition: "Good",     category: "Shoes",       seller_alias: "lazy_fox",     seller_dept: "MBA" },
  { id: "4", title: "Zara Crop Jacket",     price: 450, size: "S",   condition: "Fair",     category: "Outerwear",   seller_alias: "quick_owl",    seller_dept: "BCA" },
  { id: "5", title: "Formal Shirt White",   price: 199, size: "L",   condition: "Like New", category: "Tops",        seller_alias: "wise_bear",    seller_dept: "CSE" },
  { id: "6", title: "Palazzo Pants Black",  price: 275, size: "XS",  condition: "Good",     category: "Bottoms",     seller_alias: "bold_lynx",    seller_dept: "BBA" },
  { id: "7", title: "Canvas Tote Bag",      price: 149, size: "Free",condition: "Like New", category: "Bags",        seller_alias: "pink_wolf",    seller_dept: "BBA" },
  { id: "8", title: "Silver Hoop Earrings", price: 99,  size: "Free",condition: "Good",     category: "Accessories", seller_alias: "star_fox",     seller_dept: "CSE" },
];

const TICKER = ["ZERO SCAMS", "QUALITY VERIFIED", "KIIT", "STUDENT ID VERIFIED", "CAMPUS PICKUP", "ZERO SCAMS", "QUALITY VERIFIED", "KIIT"];

export default function LandingPage() {
  const [category, setCategory] = useState("All");

  const filtered = category === "All" ? FALLBACK : FALLBACK.filter(l => l.category === category);

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Nav */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <span className="text-brand-yellow font-black text-2xl tracking-widest uppercase">DRENZ</span>
        <Link href="/login" className="bg-white text-black text-sm font-semibold px-5 py-2 rounded-full">
          Join Campus
        </Link>
      </div>

      {/* Hero */}
      <div className="mx-4 mt-3 rounded-3xl p-7 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1c1c12 0%, #2a2410 50%, #1c1c12 100%)" }}>
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #F5A623, transparent)", transform: "translate(30%, -30%)" }} />

        <span className="border border-white/30 text-white text-xs px-3 py-1 rounded-full mb-5 inline-block">KIIT</span>

        <h1 className="text-4xl font-black uppercase leading-tight mb-3">
          WEAR IT.<br />
          <span className="text-brand-yellow">PASS IT.</span><br />
          LIST IT.
        </h1>

        <p className="text-white/50 text-sm mb-6 max-w-xs leading-relaxed">
          Keep the campus cycle moving with curated fashion that gets worn, passed on, and listed again with trust.
        </p>

        <Link href="/login" className="block bg-brand-yellow text-black font-bold text-center py-4 rounded-2xl text-sm">
          Join your campus →
        </Link>
      </div>

      {/* Ticker */}
      <div className="overflow-hidden mt-4 bg-brand-ticker py-2">
        <div className="flex gap-8 animate-marquee whitespace-nowrap">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="text-black text-xs font-black tracking-widest shrink-0">+ {item}</span>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-white px-4 pt-3 pb-2 mt-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setCategory(cat.label)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                category === cat.label
                  ? "bg-black text-white"
                  : "bg-black/5 text-black/60"
              }`}
            >
              {cat.emoji && <span>{cat.emoji}</span>}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="bg-white px-4 pt-4 pb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {filtered.map((listing, i) => {
            const bg    = CARD_COLORS[i % CARD_COLORS.length];
            const emoji = CARD_EMOJIS[listing.category ?? ""] ?? "👗";
            return (
              <Link key={listing.id} href="/login">
                <div className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="h-40 flex items-center justify-center relative" style={{ background: bg }}>
                    <span className="text-5xl">{emoji}</span>
                    <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest">
                      VERIFIED
                    </span>
                    <button onClick={e => e.preventDefault()} className="absolute top-2 right-2 bg-white/80 rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      🤍
                    </button>
                  </div>
                  <div className="bg-brand-card p-3">
                    <p className="text-white text-xs font-semibold truncate">{listing.title}</p>
                    <p className="text-brand-yellow font-black text-sm mt-0.5">₹{listing.price}</p>
                    <p className="text-white/40 text-[10px] mt-0.5 truncate">{listing.seller_alias} · {listing.seller_dept}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    {/* Footer */}
<div className="px-6 py-8 border-t border-white/10 mt-8">
  <p className="text-white/30 text-xs text-center mb-3">drenZ · KIIT Campus Only</p>
  <div className="flex justify-center gap-4 flex-wrap">
    <a href="/legal#terms" className="text-white/30 text-xs hover:text-white/60">Terms</a>
    <a href="/legal#privacy" className="text-white/30 text-xs hover:text-white/60">Privacy</a>
    <a href="/legal#shipping" className="text-white/30 text-xs hover:text-white/60">Shipping</a>
    <a href="/legal#refunds" className="text-white/30 text-xs hover:text-white/60">Refunds</a>
    <a href="/legal#contact" className="text-white/30 text-xs hover:text-white/60">Contact</a>
  </div>
</div>
      <BottomNav />
    </main>
  );
}
