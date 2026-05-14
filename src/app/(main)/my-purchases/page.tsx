"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const TABS = ["Active", "Completed", "Disputed"];

const FALLBACK = {
  Active: [
    {
      id: "1", listing_title: "H&M Oversized Hoodie", price: 349,
      seller_alias: "cool_tiger", expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      handoff_code: "7842", code_revealed: false,
    },
  ],
  Completed: [
    {
      id: "2", listing_title: "Levi's 511 Jeans", price: 599,
      seller_alias: "lazy_fox", completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      rated: false,
    },
  ],
  Disputed: [
    {
      id: "3", listing_title: "Nike Tanjun Sneakers", price: 799,
      seller_alias: "bold_lynx", dispute_status: "open",
      dispute_category: "item_not_as_described",
    },
  ],
};

export default function MyPurchases() {
  const [tab,          setTab]          = useState("Active");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [revealed,     setRevealed]     = useState<Record<string, boolean>>({});
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
        Active: "reserved", Completed: "completed", Disputed: "disputed"
      };

      const { data } = await supabase
        .from("transactions")
        .select("id, status, handoff_code_display, expires_at, completed_at, listing:listings(title, price), seller:users!seller_id(alias)")
        .eq("buyer_id", user.id)
        .eq("status", statusMap[tab]);

      setTransactions(data && data.length > 0 ? data.map((t: any) => ({
        ...t,
        listing_title:  t.listing?.title,
        price:          t.listing?.price,
        seller_alias:   t.seller?.alias,
      })) : FALLBACK[tab as keyof typeof FALLBACK] ?? []);

      setLoading(false);
    };
    fetch();
  }, [tab]);

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">My Purchases</h1>
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
      ) : transactions.length === 0 ? (
        <div className="text-center mt-20 px-6">
          <p className="text-4xl mb-3">🛍️</p>
          <p className="text-white/40 text-sm">No {tab.toLowerCase()} purchases</p>
          <Link href="/home" className="mt-4 inline-block text-brand-yellow text-sm font-semibold">
            Browse listings →
          </Link>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {transactions.map((t: any) => (
            <div key={t.id} className="bg-brand-card border border-white/10 rounded-2xl p-4">

              {/* Title + price */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold text-sm">{t.listing_title}</p>
                  <p className="text-brand-yellow font-bold mt-0.5">₹{t.price}</p>
                </div>
                <p className="text-white/40 text-xs">Seller: <span className="text-white font-semibold">{t.seller_alias}</span></p>
              </div>

              {/* Active — handoff code + timer + meetup */}
              {tab === "Active" && (
                <div className="space-y-3">
                  {/* Handoff code */}
                  <div className="bg-black/30 rounded-xl p-3 text-center">
                    <p className="text-white/40 text-xs mb-2">Your handoff code</p>
                    {revealed[t.id] ? (
                      <p className="text-brand-yellow font-black text-3xl tracking-widest">
                        {t.handoff_code ?? t.handoff_code_display ?? "7842"}
                      </p>
                    ) : (
                      <button
                        onClick={() => setRevealed(prev => ({ ...prev, [t.id]: true }))}
                        className="text-white/40 font-black text-3xl tracking-widest"
                      >
                        ● ● ● ●
                      </button>
                    )}
                    <p className="text-white/30 text-xs mt-1">tap to {revealed[t.id] ? "hide" : "reveal"}</p>
                  </div>

                  {/* Expires */}
                  <p className="text-white/40 text-xs text-center">
                    Expires: <span className="text-brand-yellow font-semibold">
                      {new Date(t.expires_at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </span>
                  </p>

                  <Link
                    href={`/meetup/${t.id}`}
                    className="block w-full text-center bg-brand-yellow text-black font-bold text-sm py-3 rounded-2xl"
                  >
                    Go to Meetup →
                  </Link>
                </div>
              )}

              {/* Completed — rate seller */}
              {tab === "Completed" && (
                <div className="space-y-2">
                  <p className="text-white/40 text-xs">
                    Completed {new Date(t.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {!t.rated && (
                    <Link
                      href={`/rating/${t.id}`}
                      className="block w-full text-center bg-brand-yellow text-black font-bold text-sm py-3 rounded-2xl"
                    >
                      ⭐ Rate Seller
                    </Link>
                  )}
                  {t.rated && (
                    <p className="text-green-400 text-xs font-semibold text-center">✓ Rated</p>
                  )}
                </div>
              )}

              {/* Disputed — status + link */}
              {tab === "Disputed" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      t.dispute_status === "open"     ? "bg-orange-950 text-orange-400" :
                      t.dispute_status === "resolved" ? "bg-green-950 text-green-400"  :
                                                        "bg-red-950 text-red-400"
                    }`}>
                      {t.dispute_status?.toUpperCase() ?? "OPEN"}
                    </span>
                    <span className="text-white/40 text-xs">{t.dispute_category?.replace(/_/g, " ")}</span>
                  </div>
                  <Link
                    href={`/dispute/${t.id}`}
                    className="block w-full text-center bg-brand-card border border-white/10 text-white font-semibold text-sm py-3 rounded-2xl"
                  >
                    View Dispute →
                  </Link>
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