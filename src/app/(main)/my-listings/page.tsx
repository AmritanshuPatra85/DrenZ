"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const TABS = ["Active", "Reserved", "Sold"];

/* ── Inline SVG icons ── */

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ViewsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function BoostIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ClosetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-[#686D72] opacity-20">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  );
}

export default function MyListings() {
  const [tab, setTab] = useState("Active");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  const emptyMessages: Record<string, string> = {
    Active: "No active listings yet.",
    Reserved: "No reserved listings.",
    Sold: "No sold listings yet.",
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-28">
      <div className="mx-auto max-w-4xl px-4 md:px-8">

        {/* ── Header ── */}
        <header className="pt-6 pb-5 lg:pt-8 lg:pb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
            >
              <BackIcon />
              BACK
            </button>
            <Link
              href="/sell"
              className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] font-semibold text-[#E5FF00] hover:text-[#F2FF4A] transition-colors duration-200 uppercase"
            >
              <PlusIcon />
              NEW LISTING
            </Link>
          </div>
          <span className="block text-[10px] tracking-[0.25em] text-[#686D72] uppercase mb-2">
            DRENZ / SELLER STUDIO
          </span>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">MY LISTINGS</h1>
          <p className="mt-1 text-sm text-[#969696]">
            Manage the pieces you&apos;ve put into circulation.
          </p>
        </header>

        {/* ── Tab navigation ── */}
        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-[11px] tracking-[0.08em] font-semibold transition-all duration-200 ${
                tab === t
                  ? "bg-[#E5FF00] text-[#080808]"
                  : "bg-[#151515] border border-[#292929] text-[#969696] hover:text-[#BFC3C7] hover:border-[#BFC3C7]/20"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        {loading ? (
          /* ── Loading skeleton ── */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#151515] border border-[#292929] rounded-xl overflow-hidden animate-pulse">
                <div className="flex gap-3 p-4">
                  <div className="w-16 h-16 rounded-lg bg-[#292929] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-[#292929] rounded" />
                    <div className="h-4 w-1/3 bg-[#292929] rounded" />
                    <div className="h-2 w-1/4 bg-[#292929] rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClosetIcon />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mt-4 mb-2">
              YOUR CLOSET IS QUIET
            </p>
            <p className="text-[12px] text-[#686D72]/70 mb-6">
              {emptyMessages[tab]}
            </p>
            {tab === "Active" && (
              <Link
                href="/sell"
                className="group flex items-center justify-center gap-2 px-6 h-10 rounded-lg bg-[#E5FF00] text-[#080808] text-[11px] font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
              >
                <PlusIcon />
                CREATE LISTING
              </Link>
            )}
          </div>
        ) : (
          /* ── Listing cards ── */
          <div className="space-y-3">
            {listings.map((l: any) => (
              <div key={l.id} className="bg-[#151515] border border-[#292929] rounded-xl overflow-hidden transition-all duration-200 hover:border-[#292929]/80">

                {/* ── Listing row ── */}
                <Link href={`/listing/${l.id}`} className="flex gap-3 p-4">
                  <div className="w-16 h-16 rounded-lg bg-[#111111] border border-[#292929] flex items-center justify-center shrink-0 overflow-hidden">
                    {l.images?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F5F5F5] font-medium text-sm truncate">
                      {l.title}
                    </p>
                    <p className="text-[#E5FF00] font-bold text-base mt-0.5">
                      ₹{l.price}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded bg-[#111111] border border-[#292929] text-[#BFC3C7]">
                      {(l.condition ?? "").replace("_", " ")}
                    </span>
                  </div>
                </Link>

                {/* ── Active listing actions ── */}
                {tab === "Active" && (
                  <div className="px-4 pb-4 border-t border-[#292929] pt-3 space-y-3">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1 text-[#686D72] text-[11px]">
                        <ViewsIcon /> {l.views ?? 0} views
                      </span>
                      <span className="flex items-center gap-1 text-[#686D72] text-[11px]">
                        <HeartIcon /> {l.likes_count ?? 0} likes
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/sell?edit=${l.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-center bg-[#111111] border border-[#292929] text-[#BFC3C7] text-[11px] font-semibold tracking-[0.06em] py-2.5 rounded-lg transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5]"
                      >
                        <EditIcon /> EDIT
                      </Link>
                      <Link
                        href={`/listing/${l.id}/boost`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-center bg-[#111111] border border-[#292929] text-[#BFC3C7] text-[11px] font-semibold tracking-[0.06em] py-2.5 rounded-lg transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5]"
                      >
                        <BoostIcon /> BOOST
                      </Link>
                      <button
                        onClick={() => handleDelete(l.id, l.title)}
                        disabled={deleting === l.id}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-[#2a1215] border border-[#3d1a1a] text-[#e55555] text-[11px] font-semibold tracking-[0.06em] py-2.5 rounded-lg transition-all duration-200 hover:bg-[#351518] disabled:opacity-50"
                      >
                        {deleting === l.id ? "..." : <><TrashIcon /> DELETE</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Reserved listing info ── */}
                {tab === "Reserved" && (
                  <div className="px-4 pb-4 border-t border-[#292929] pt-3 space-y-2">
                    <p className="text-[#686D72] text-[11px]">
                      Buyer:{" "}
                      <span className="text-[#F5F5F5] font-medium">
                        {l.buyer_alias ?? "Anonymous"}
                      </span>
                    </p>
                    <p className="text-[#686D72] text-[11px]">
                      Expires:{" "}
                      <span className="text-[#E5FF00] font-medium">
                        {l.expires_at
                          ? new Date(l.expires_at).toLocaleString()
                          : "—"}
                      </span>
                    </p>
                    <button className="w-full flex items-center justify-center gap-2 bg-[#E5FF00] text-[#080808] text-[11px] font-semibold tracking-[0.1em] py-2.5 rounded-lg transition-all duration-200 hover:bg-[#F2FF4A] active:scale-[0.98]">
                      <PinIcon /> GO TO MEETUP →
                    </button>
                  </div>
                )}

                {/* ── Sold listing info ── */}
                {tab === "Sold" && (
                  <div className="px-4 pb-4 border-t border-[#292929] pt-3 space-y-2">
                    <p className="text-[#686D72] text-[11px]">
                      Payout:{" "}
                      <span className="text-[#E5FF00] font-bold text-sm">
                        ₹{l.payout ?? Math.floor(l.price * 0.95)}
                      </span>
                    </p>
                    {!l.rated && (
                      <Link
                        href={`/rating/${l.id}`}
                        className="flex items-center justify-center gap-2 w-full bg-[#E5FF00] text-[#080808] text-[11px] font-semibold tracking-[0.1em] py-2.5 rounded-lg transition-all duration-200 hover:bg-[#F2FF4A] active:scale-[0.98]"
                      >
                        <StarIcon /> RATE BUYER
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}