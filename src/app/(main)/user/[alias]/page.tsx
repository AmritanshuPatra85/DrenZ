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
    <main className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Header */}
      <div className="px-4 pt-5 pb-2 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <div className="flex-1" />
        <button className="text-white/30 text-xs border border-white/10 px-3 py-1.5 rounded-full">⚑ Report</button>
      </div>

      {/* Avatar + info */}
      <div className="flex flex-col items-center px-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-brand-yellow/20 border-2 border-brand-yellow flex items-center justify-center text-3xl font-black text-brand-yellow mb-3">
          {profile?.alias?.[0]?.toUpperCase() ?? "?"}
        </div>
        <h2 className="text-white font-black text-xl">{profile?.alias}</h2>
        <p className="text-white/40 text-sm mt-1">{profile?.department} · {profile?.year}</p>
        <p className="text-white/30 text-xs mt-1">
          Member since {new Date(profile?.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>

        {/* Trust metrics */}
        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <p className="text-brand-yellow font-black text-lg">{profile?.avg_rating?.toFixed(1) ?? "—"}</p>
            <p className="text-white/40 text-xs">Rating</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-brand-yellow font-black text-lg">{profile?.total_reviews ?? 0}</p>
            <p className="text-white/40 text-xs">Reviews</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-brand-yellow font-black text-lg">{listings.length}</p>
            <p className="text-white/40 text-xs">Active</p>
          </div>
        </div>
      </div>

      {/* Active listings */}
      {listings.length > 0 && (
        <div className="px-4 mb-6">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Active Listings</p>
          <div className="grid grid-cols-2 gap-3">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="px-4 mb-6">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Reviews</p>
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-brand-card border border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{r.reviewer?.alias ?? r.reviewer_alias ?? "Anonymous"}</span>
                    <span className="bg-brand-yellow/20 text-brand-yellow text-[9px] font-bold px-2 py-0.5 rounded-full">{r.badge ?? "Buyer"}</span>
                  </div>
                  <span className="text-brand-yellow text-sm">{"★".repeat(r.rating)}</span>
                </div>
                {r.comment && <p className="text-white/50 text-xs leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
}