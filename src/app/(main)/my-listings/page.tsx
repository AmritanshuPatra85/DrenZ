"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const TABS = ["Active", "Reserved", "Sold"];

const FALLBACK = {
  Active: [
    { id: "1", title: "H&M Oversized Hoodie", price: 349, condition: "Good", views: 24, likes: 6, messages: 3 },
    { id: "2", title: "Formal Shirt White",   price: 199, condition: "Like New", views: 11, likes: 2, messages: 1 },
  ],
  Reserved: [
    { id: "3", title: "Nike Tanjun Sneakers", price: 799, condition: "Good", buyer_alias: "cool_tiger", expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString() },
  ],
  Sold: [
    { id: "4", title: "Levi's 511 Jeans", price: 599, condition: "Like New", payout: 569, rated: false },
  ],
};

export default function MyListings() {
  const [tab,      setTab]      = useState("Active");
  const [listings, setListings] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const router = useRouter();

 const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const statusMap: Record<string, string> = {
        Active: "active", Reserved: "reserved", Sold: "sold"
      };

      const { data } = await supabase
        .from("listings")
        .select("id, title, price, condition, status, views, likes_count, created_at")
        .eq("seller_id", user.id)
        .eq("status", statusMap[tab]);

      setListings(data && data.length > 0 ? data : FALLBACK[tab as keyof typeof FALLBACK] ?? []);
      setLoading(false);
    };
    fetch();
  }, [tab]);

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">My Listings</h1>
        <div className="w-12" />
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              tab === t ? "bg-brand-yellow text-black" : "bg-brand-card border border-white/10 text-white/50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-center text-white/30 text-sm mt-10">Loading…</p>
      ) : listings.length === 0 ? (
        <div className="text-center mt-20 px-6">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-white/40 text-sm">No {tab.toLowerCase()} listings</p>
          {tab === "Active" && (
            <Link href="/sell" className="mt-4 inline-block bg-brand-yellow text-black font-bold px-6 py-3 rounded-2xl text-sm">
              + Create Listing
            </Link>
          )}
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {listings.map((l: any) => (
            <div key={l.id} className="bg-brand-card border border-white/10 rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm truncate">{l.title}</p>
                  <p className="text-brand-yellow font-bold mt-0.5">₹{l.price}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ml-3 ${
                  l.condition === "Like New" ? "bg-green-950 text-green-400" :
                  l.condition === "Good"     ? "bg-lime-950 text-lime-400" :
                                              "bg-orange-950 text-orange-400"
                }`}>{l.condition}</span>
              </div>

              {/* Active — stats + actions */}
              {tab === "Active" && (
                <>
                  <div className="flex gap-4 mb-3">
                    <span className="text-white/40 text-xs">👁 {l.views ?? 0} views</span>
                    <span className="text-white/40 text-xs">❤️ {l.likes ?? l.likes_count ?? 0} likes</span>
                    <span className="text-white/40 text-xs">💬 {l.messages ?? 0} messages</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/sell/edit/${l.id}`} className="flex-1 text-center bg-white/10 text-white text-xs font-semibold py-2 rounded-xl">✏️ Edit</Link>
                    <button className="flex-1 bg-white/10 text-white text-xs font-semibold py-2 rounded-xl">🚀 Boost</button>
                    <button className="flex-1 bg-red-950 border border-red-800 text-red-400 text-xs font-semibold py-2 rounded-xl">🗑️ Delete</button>
                  </div>
                </>
              )}

              {/* Reserved — buyer + timer + meetup */}
              {tab === "Reserved" && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs">Buyer: <span className="text-white font-semibold">{l.buyer_alias ?? "Anonymous"}</span></p>
                  <p className="text-white/50 text-xs">Expires: <span className="text-brand-yellow font-semibold">{new Date(l.expires_at).toLocaleString()}</span></p>
                  <button className="w-full bg-brand-yellow text-black text-xs font-bold py-2 rounded-xl">Go to Meetup →</button>
                </div>
              )}

              {/* Sold — payout + rating */}
              {tab === "Sold" && (
                <div className="space-y-2">
                  <p className="text-white/50 text-xs">Payout: <span className="text-green-400 font-bold">₹{l.payout ?? Math.floor(l.price * 0.95)}</span></p>
                  {!l.rated && (
                    <Link href={`/rating/${l.id}`} className="block w-full text-center bg-brand-yellow text-black text-xs font-bold py-2 rounded-xl">
                      ⭐ Rate Buyer
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}