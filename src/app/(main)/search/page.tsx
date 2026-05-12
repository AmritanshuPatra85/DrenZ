"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";

const CATEGORIES  = ["All", "Tops", "Bottoms", "Shoes", "Bags", "Accessories"];
const CONDITIONS  = ["Any", "Like New", "Good", "Fair"];

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
  const [minPrice,   setMinPrice]   = useState(0);
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
      .gte("price", minPrice)
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
  }, [query, category, condition, minPrice, maxPrice]);

  // Debounce search on query change
  useEffect(() => {
    const t = setTimeout(search, 400);
    return () => clearTimeout(t);
  }, [search]);

  const clearAll = () => {
    setCategory("All");
    setCondition("Any");
    setMinPrice(0);
    setMaxPrice(2000);
  };

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Search bar */}
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
          className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-col