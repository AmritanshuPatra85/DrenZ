"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";

export default function PublicProfile() {
  const { alias }  = useParams();
  const router     = useRouter();
  const [profile,  setProfile]  = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [reviews,  setReviews]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetch = async () => {
      const { data: user } = await supabase
        .from("users")
        .select("id, alias, department, year, avg_rating, total_reviews, created_at")
        .eq("alias", alias)
        .single();

      if (!user) {
        setProfile({
          alias, department: "CSE", year: "2nd Year",
          avg_rating: 4.5, total_reviews: 8,
          created_at: new Date().toISOString(),
        });
        setListings([
          { id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M",  condition: "Good",     category: "Tops",    seller_alias: alias, seller_dept: "CSE" },
          { id: "2", title: "Levi's 511 Jeans",     price: 599, size: "30", condition: "Like New", category: "Bottoms", seller_alias: alias, seller_dept: "CSE" },
        ]);
        setReviews([
          { id: "1", rating: 5, comment: "Super trustworthy, item exactly as described.", reviewer_alias: "cool_tiger",   badge: "Buyer"  },
          { id: "2", rating: 4, comment: "Quick meetup, no drama.",                       reviewer_alias: "lazy_fox",     badge: "Buyer"  },
        ]);
        setLoading(false);
        return;
      }

      const [{ data: listingsData }, { data: reviewsData }] = await Promise.all([
        supabase.from("listings").select("id, title, price, size, condition, category, image_url").eq("seller_id", user.id).eq("status", "active").limit(6),
        supabase.from("reviews").select("id, rating, comment, reviewer:users!reviewer_id(alias)").eq("reviewee_id", user.id).limit(5),
      ]);

      setProfile(user);
      setListings(listingsData ?? []);
      setReviews(reviewsData ?? []);
      setLoading(false);
    };
    fetch();
  }, [alias]);

  if (loading) return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      {/* Header skeleton */}
      <div className="border-b border-[#292929]">
        <div className="mx-auto max-w-[1140px] flex items-center justify-between px-4 py-5 md:px-8">
          <div className="h-2 w-12 bg-[#292929] rounded animate-pulse" />
          <div className="h-2 w-24 bg-[#292929] rounded animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-[1140px] px-4 pt-8 md:px-8">
        {/* Hero skeleton */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-full bg-[#292929] animate-pulse mb-5" />
          <div className="h-5 w-36 bg-[#292929] rounded animate-pulse mb-2" />
          <div className="h-3 w-28 bg-[#292929] rounded animate-pulse mb-2" />
          <div className="h-2.5 w-40 bg-[#292929] rounded animate-pulse mb-5" />
          <div className="flex items-center gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center">
                <div className="h-4 w-10 bg-[#292929] rounded animate-pulse mx-auto mb-1.5" />
                <div className="h-2 w-12 bg-[#292929] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Listings skeleton */}
        <div className="mb-10">
          <div className="h-2.5 w-28 bg-[#292929] rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-[#292929] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
        {/* Reviews skeleton */}
        <div>
          <div className="h-2.5 w-20 bg-[#292929] rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-[#292929] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-24">
      {/* ── Header ── */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-[1140px] flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / PROFILE
          </span>
          <button
            aria-label="Report user"
            className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-[#686D72] hover:text-[#e55555] transition-colors duration-200 uppercase"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            REPORT
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1140px] px-4 pt-10 md:px-8">
        {/* ── Profile hero ── */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-full bg-[#151515] border border-[#E5FF00]/25 flex items-center justify-center mb-5">
            <span className="text-3xl font-bold text-[#E5FF00]">
              {profile?.alias?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-[#F5F5F5] tracking-tight">
            @{profile?.alias}
          </h1>
          <p className="text-[11px] text-[#969696] mt-1.5 tracking-wide">
            {profile?.department} · {profile?.year}
          </p>
          <p className="text-[10px] text-[#686D72] mt-1 tracking-wide">
            Member since {new Date(profile?.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
          </p>

          {/* Trust metrics */}
          <div className="flex items-center gap-5 mt-6">
            <div className="text-center">
              <p className="text-base font-bold text-[#E5FF00]">{profile?.avg_rating?.toFixed(1) ?? "—"}</p>
              <p className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">Rating</p>
            </div>
            <div className="w-px h-6 bg-[#292929]" />
            <div className="text-center">
              <p className="text-base font-bold text-[#E5FF00]">{profile?.total_reviews ?? 0}</p>
              <p className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">Reviews</p>
            </div>
            <div className="w-px h-6 bg-[#292929]" />
            <div className="text-center">
              <p className="text-base font-bold text-[#E5FF00]">{listings.length}</p>
              <p className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">Active</p>
            </div>
          </div>
        </div>

        {/* ── Active listings ── */}
        {listings.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase">
                Active Listings
              </span>
              <span className="text-[10px] text-[#686D72] tracking-wide">
                {String(listings.length).padStart(2, "0")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {listings.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase">
                Reviews
              </span>
              <span className="text-[10px] text-[#686D72] tracking-wide">
                {String(reviews.length).padStart(2, "0")}
              </span>
            </div>
            <div className="space-y-2">
              {reviews.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-[#111111] border border-[#292929] rounded-xl p-4 transition-all duration-200 hover:border-[#686D72]/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#F5F5F5]">
                        {r.reviewer?.alias ?? r.reviewer_alias ?? "Anonymous"}
                      </span>
                      <span className="text-[9px] font-semibold tracking-[0.1em] text-[#686D72] uppercase border border-[#292929] rounded px-1.5 py-px">
                        {r.badge ?? "Buyer"}
                      </span>
                    </div>
                    <span className="text-[#E5FF00] text-sm tracking-wider">
                      {"★".repeat(r.rating)}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="text-[12px] text-[#969696] leading-relaxed">
                      {r.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}