"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Bags", "Accessories"];
const CONDITIONS = ["Any", "Like New", "Good", "Fair"];

const FALLBACK = [
  { id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M",  condition: "Good",     seller_alias: "shadow_panda", seller_dept: "CSE" },
  { id: "2", title: "Levi's 511 Jeans",     price: 599, size: "30", condition: "Like New", seller_alias: "cool_tiger",   seller_dept: "ECE" },
  { id: "3", title: "Nike Tanjun Sneakers", price: 799, size: "9",  condition: "Good",     seller_alias: "lazy_fox",     seller_dept: "MBA" },
  { id: "4", title: "Zara Crop Jacket",     price: 450, size: "S",  condition: "Fair",     seller_alias: "quick_owl",    seller_dept: "BCA" },
  { id: "5", title: "Formal Shirt White",   price: 199, size: "L",  condition: "Like New", seller_alias: "wise_bear",    seller_dept: "CSE" },
  { id: "6", title: "Palazzo Pants Black",  price: 275, size: "XS", condition: "Good",     seller_alias: "bold_lynx",    seller_dept: "BBA" },
];

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#151515] border border-[#292929] overflow-hidden animate-pulse">
      <div className="aspect-[4/5] bg-[#111111]" />
      <div className="px-3.5 py-3 space-y-2">
        <div className="h-3 w-3/4 bg-[#292929] rounded" />
        <div className="h-4 w-1/3 bg-[#292929] rounded" />
        <div className="h-2 w-1/2 bg-[#292929] rounded" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query,      setQuery]      = useState("");
  const [category,   setCategory]   = useState("All");
  const [condition,  setCondition]  = useState("Any");
  const [maxPrice,   setMaxPrice]   = useState(2000);
  const [showFilter, setShowFilter] = useState(false);
  const [results,    setResults]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const hasActiveFilters =
    category !== "All" || condition !== "Any" || maxPrice !== 2000;

  const search = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("listings")
      .select("id, title, price, size, condition, category, image_url, seller:users(alias, dept)")
      .eq("status", "active")
      .lte("price", maxPrice);

    if (query.trim())        q = q.ilike("title", `%${query.trim()}%`);
    if (category !== "All")  q = q.eq("category", category);
    if (condition !== "Any") q = q.eq("condition", condition);

    const { data } = await q.limit(40);

    if (!data || data.length === 0) {
      setResults(FALLBACK);
    } else {
      setResults(data.map((l: any) => ({
        ...l,
        seller_alias: l.seller?.alias,
        seller_dept:  l.seller?.dept,
      })));
    }
    setLoading(false);
  }, [query, category, condition, maxPrice]);

  useEffect(() => {
    const t = setTimeout(search, 400);
    return () => clearTimeout(t);
  }, [search]);

  const clearAll = () => {
    setCategory("All");
    setCondition("Any");
    setMaxPrice(2000);
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">

        {/* ── Header ── */}
        <header className="pt-8 pb-6 md:pt-12 md:pb-8">
          <span className="text-[10px] font-semibold tracking-[0.25em] text-[#686D72] uppercase mb-3 block">
            DRENZ
          </span>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
            FIND YOUR{" "}
            <span className="text-[#E5FF00]">NEXT FIT.</span>
          </h1>
          <p className="mt-2 text-sm text-[#969696]">
        {/* ── Search bar ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 flex items-center bg-[#111111] border border-[#292929] rounded-xl px-4 gap-3 h-12 transition-colors duration-200 focus-with            Discover pieces from your campus.
          </p>
        </header>

in:border-[#E5FF00]/30 focus-within:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#686D72] shrink-0"
            >
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="M15.5 15.5L21 21" />
            </svg>
            <input
              type="text"
              placeholder="Search listings..."
              aria-label="Search listings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[#F5F5F5] placeholder-[#686D72] text-sm outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-[#686D72] hover:text-[#BFC3C7] transition-colors duration-200 shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilter(!showFilter)}
            aria-label="Toggle filters"
            className={`
              relative flex items-center justify-center h-12 w-12 rounded-xl border transition-all duration-200 shrink-0
              ${showFilter
                ? "bg-[#E5FF00] border-[#E5FF00] text-[#080808]"
                : "bg-[#111111] border-[#292929] text-[#686D72] hover:text-[#BFC3C7] hover:border-[#BFC3C7]/20"
              }
            `}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="8" y1="12" x2="20" y2="12" />
              <line x1="12" y1="18" x2="20" y2="18" />
              <circle cx="6" cy="6" r="2" fill="currentColor" />
              <circle cx="10" cy="12" r="2" fill="currentColor" />
              <circle cx="14" cy="18" r="2" fill="currentColor" />
            </svg>
            {/* Active filter indicator */}
            {hasActiveFilters && !showFilter && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#E5FF00]" />
            )}
          </button>
        </div>

        {/* ── Category tabs ── */}
        <div className="mb-5 -mx-4 md:mx-0 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 px-4 md:px-0 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`
                  relative px-4 py-2 text-xs tracking-[0.08em] font-medium transition-colors duration-200 whitespace-nowrap
                  ${category === cat
                    ? "text-[#E5FF00]"
                    : "text-[#686D72] hover:text-[#BFC3C7]"
                  }
                `}
              >
                {cat.toUpperCase()}
                {category === cat && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-[#E5FF00]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Filter panel ── */}
        {showFilter && (
          <div className="mb-5 bg-[#111111] border border-[#292929] rounded-xl p-5 space-y-5">
            {/* Condition */}
            <div>
              <span className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-3">
                Condition
              </span>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCondition(c)}
                    className={`
                      px-3.5 py-1.5 rounded-lg text-[11px] tracking-[0.06em] font-medium transition-all duration-200
                      ${condition === c
                        ? "bg-[#E5FF00] text-[#080808]"
                        : "bg-[#151515] border border-[#292929] text-[#969696] hover:text-[#BFC3C7] hover:border-[#BFC3C7]/20"
                      }
                    `}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase">
                  Max Price
                </span>
                <span className="text-sm font-semibold text-[#E5FF00]">
                  ₹{maxPrice.toLocaleString("en-IN")}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={2000}
                step={50}
                value={maxPrice}
                aria-label="Maximum price"
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1 bg-[#292929] rounded-full appearance-none cursor-pointer accent-[#E5FF00]"
              />
              <div className="flex justify-between mt-1.5">
                <span className="text-[9px] text-[#686D72]">₹0</span>
                <span className="text-[9px] text-[#686D72]">₹2,000</span>
              </div>
            </div>

            {/* Clear */}
            <button
              onClick={clearAll}
              className="w-full text-center text-[11px] tracking-[0.08em] text-[#686D72] hover:text-[#969696] py-2.5 border border-[#292929] rounded-lg transition-colors duration-200"
            >
              CLEAR ALL FILTERS
            </button>
          </div>
        )}

        {/* ── Results header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase">
              {loading ? "SEARCHING..." : "RESULTS"}
            </span>
            {!loading && (
              <span className="text-[11px] text-[#969696]">
                {results.length} {results.length === 1 ? "piece" : "pieces"}
              </span>
            )}
          </div>
        </div>

        {/* ── Product grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {results.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#686D72] opacity-25 mb-5"
            >
              <circle cx="10.5" cy="10.5" r="7" />
              <path d="M15.5 15.5L21 21" />
              <path d="M8 8l5 5M13 8l-5 5" />
            </svg>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
              No pieces found
            </p>
            <p className="text-[12px] text-[#686D72]/70 mb-6 max-w-[240px]">
              Try another search or loosen your filters.
            </p>
            <button
              onClick={clearAll}
              className="text-xs tracking-[0.1em] text-[#E5FF00] hover:text-[#F2FF4A] transition-colors duration-200 font-medium"
            >
              CLEAR FILTERS
            </button>
          </div>
        )}
      </div>

      <BottomNav />

      {/* Hide scrollbar on category nav */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}