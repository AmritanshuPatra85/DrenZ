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
    <main className="min-h-screen bg-brand-dark text-white pb-24">
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <div className="flex-1 flex items-center bg-brand-card border border-white/10 rounded-2xl px-4 gap-3">
          <span className="text-white/40 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search listings…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/30 text-sm py-3 outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-white/40 text-lg">✕</button>
          )}
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-colors ${
            showFilter ? "bg-brand-yellow text-black border-brand-yellow" : "bg-brand-card border-white/10 text-white/60"
          }`}
        >
          Filter
        </button>
      </div>

      {showFilter && (
        <div className="mx-4 mb-4 bg-brand-card border border-white/10 rounded-2xl p-4 space-y-4">
          <div>
            <p className="text-white/50 text-xs font-semibold mb-2 uppercase tracking-widest">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    category === cat ? "bg-brand-yellow text-black" : "bg-white/10 text-white/60"
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/50 text-xs font-semibold mb-2 uppercase tracking-widest">Condition</p>
            <div className="flex gap-2">
              {CONDITIONS.map(c => (
                <button key={c} onClick={() => setCondition(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    condition === c ? "bg-brand-yellow text-black" : "bg-white/10 text-white/60"
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white/50 text-xs font-semibold mb-2 uppercase tracking-widest">Max Price — ₹{maxPrice}</p>
            <input type="range" min={0} max={2000} step={50} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-yellow"
            />
          </div>
          <button onClick={clearAll} className="w-full text-center text-white/40 text-xs font-semibold py-2 border border-white/10 rounded-xl">
            Clear all filters
          </button>
        </div>
      )}

      <div className="px-4 mb-3">
        <p className="text-white/30 text-xs">{loading ? "Searching…" : `${results.length} results`}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4">
        {results.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div className="text-center mt-20">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white/40 text-sm">No listings found</p>
          <button onClick={clearAll} className="mt-4 text-brand-yellow text-sm font-semibold">Clear filters</button>
        </div>
      )}

      <BottomNav />
    </main>
  );
}

