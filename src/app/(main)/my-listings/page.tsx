"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const TABS = ["Active", "Reserved", "Sold"];

export default function MyListings() {
  const [tab,      setTab]      = useState("Active");
  const [listings, setListings] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadListings = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const statusMap: Record<string, string> = {
      Active: "active", Reserved: "reserved", Sold: "sold"
    };

    const { data } = await supabase
      .from("listings")
      .select("id, title, price, condition, status, views, likes_count, created_at, images")
      .eq("seller_id", user.id)
      .eq("status", statusMap[tab]);

    setListings(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadListings(); }, [tab]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await supabase
      .from("listings")
      .update({ status: "removed" })
      .eq("id", id);
    await loadListings();
    setDeleting(null);
  };

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">My Listings</h1>
        <Link href="/sell" className="text-brand-yellow text-sm font-semibold">+ New</Link>
      </div>

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
            <div key={l.id} className="bg-brand-card border border-white/10 rounded-2xl overflow-hidden">

              <Link href={`/listing/${l.id}`} className="flex gap-3 p-4">
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                  {l.images?.[0] ? (
                    <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👗</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{l.title}</p>
                  <p className="text-brand-yellow font-bold mt-0.5">₹{l.price}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    l.condition === "like_new" ? "bg-green-950 text-green-400" :
                    l.condition === "good"     ? "bg-lime-950 text-lime-400" :
                    l.condition === "new"      ? "bg-blue-950 text-blue-400" :
                                                "bg-orange-950 text-orange-400"
                  }`}>{l.condition?.replace("_", " ")}</span>
                </div>
              </Link>

              {tab === "Active" && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  <div className="flex gap-4">
                    <span className="text-white/40 text-xs">👁 {l.views ?? 0} views</span>
                    <span className="text-white/40 text-xs">❤️ {l.likes_count ?? 0} likes</span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/sell?edit=${l.id}`}
                      className="flex-1 text-center bg-white/10 text-white text-xs font-semibold py-2.5 rounded-xl"
                    >
                      ✏️ Edit
                    </Link>
                    <Link
                      href={`/listing/${l.id}/boost`}
                      className="flex-1 text-center bg-white/10 text-white text-xs font-semibold py-2.5 rounded-xl"
                    >
                      🚀 Boost
                    </Link>
                    <button
                      onClick={() => handleDelete(l.id, l.title)}
                      disabled={deleting === l.id}
                      className="flex-1 bg-red-950 border border-red-800 text-red-400 text-xs font-semibold py-2.5 rounded-xl disabled:opacity-50"
                    >
                      {deleting === l.id ? "..." : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              )}

              {tab === "Reserved" && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                  <p className="text-white/50 text-xs">Buyer: <span className="text-white font-semibold">{l.buyer_alias ?? "Anonymous"}</span></p>
                  <p className="text-white/50 text-xs">Expires: <span className="text-brand-yellow font-semibold">{l.expires_at ? new Date(l.expires_at).toLocaleString() : "—"}</span></p>
                  <button className="w-full bg-brand-yellow text-black text-xs font-bold py-2.5 rounded-xl">
                    Go to Meetup →
                  </button>
                </div>
              )}

              {tab === "Sold" && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                  <p className="text-white/50 text-xs">Payout: <span className="text-green-400 font-bold">₹{l.payout ?? Math.floor(l.price * 0.95)}</span></p>
                  {!l.rated && (
                    <Link href={`/rating/${l.id}`} className="block w-full text-center bg-brand-yellow text-black text-xs font-bold py-2.5 rounded-xl">
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