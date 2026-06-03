"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Bags", "Accessories"];

const FALLBACK = [
  { id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M",  condition: "Good",     category: "Tops",        seller_alias: "shadow_panda", seller_dept: "CSE" },
  { id: "2", title: "Levi's 511 Jeans",     price: 599, size: "30", condition: "Like New", category: "Bottoms",     seller_alias: "cool_tiger",   seller_dept: "ECE" },
  { id: "3", title: "Nike Tanjun Sneakers", price: 799, size: "9",  condition: "Good",     category: "Shoes",       seller_alias: "lazy_fox",     seller_dept: "MBA" },
  { id: "4", title: "Zara Crop Jacket",     price: 450, size: "S",  condition: "Fair",     category: "Outerwear",   seller_alias: "quick_owl",    seller_dept: "BCA" },
  { id: "5", title: "Formal Shirt White",   price: 199, size: "L",  condition: "Like New", category: "Tops",        seller_alias: "wise_bear",    seller_dept: "CSE" },
  { id: "6", title: "Palazzo Pants Black",  price: 275, size: "XS", condition: "Good",     category: "Bottoms",     seller_alias: "bold_lynx",    seller_dept: "BBA" },
];

export default function HomeFeed() {
  const [listings, setListings]         = useState<any[]>([]);
  const [category, setCategory]         = useState("All");
  const [page, setPage]                 = useState(0);
  const [loading, setLoading]           = useState(false);
  const [hasMore, setHasMore]           = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const PAGE_SIZE = 20;

 const fetchListings = async (cat: string, pageNum: number, replace: boolean) => {
  setLoading(true);

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("listings")
    .select("id, title, price, condition, category, images,image_url, seller:users(alias, college)")
    .eq("status", "active")
    .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

  
  if (cat !== "All") query = query.eq("category", cat.toLowerCase());

  const { data, error } = await query;

  if (!data || data.length === 0) {
    if (pageNum === 0) setListings(FALLBACK);
    setHasMore(false);
  } else {
    const shaped = data.map((l: any) => ({
      ...l,
      image_url: l.image_url ?? l.images?.[0] ?? null,
      seller_alias: l.seller?.alias,
      seller_dept: l.seller?.college,
    }));
    setListings(prev => replace ? shaped : [...prev, ...shaped]);
    setHasMore(data.length === PAGE_SIZE);
  }
  setLoading(false);
};

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchListings(category, 0, true);
  }, [category]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchListings(category, next, false);
  };

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <h1 className="text-brand-yellow font-black text-2xl tracking-widest uppercase">drenZ</h1>
       <NotificationBell />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-3 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-brand-yellow text-black"
                : "bg-white/10 text-white/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="bg-white/10 text-white/70 text-sm font-semibold px-8 py-3 rounded-full"
          >
            Load more
          </button>
        </div>
      )}

      {loading && (
        <p className="text-center text-white/30 text-sm mt-6">Loading…</p>
      )}

      <BottomNav />
    </main>
  );
}
