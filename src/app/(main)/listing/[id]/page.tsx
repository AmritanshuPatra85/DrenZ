"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import PhotoGallery from "@/components/PhotoGallery";

const CONDITION_STYLES: Record<string, { bg: string; text: string }> = {
  "Like New": { bg: "bg-green-950",  text: "text-green-400"  },
  "Good":     { bg: "bg-lime-950",   text: "text-lime-400"   },
  "Fair":     { bg: "bg-orange-950", text: "text-orange-400" },
};

const FALLBACK = {
  id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M",
  condition: "Good", category: "Tops", description: "Worn twice, great condition. Perfect for campus.",
  image_url: null, seller_alias: "shadow_panda", seller_dept: "CSE", seller_year: "2nd Year",
};

export default function ListingDetail() {
  const { id }   = useParams();
  const router   = useRouter();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, size, condition, category, description, image_url, seller:users(alias, dept, year)")
        .eq("id", id)
        .single();

      setListing(data ? { ...data, seller_alias: data.seller?.alias, seller_dept: data.seller?.dept, seller_year: data.seller?.year } : FALLBACK);
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === data?.seller_id);
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
    </main>
  );

  const cond = listing.condition ?? "Good";
  const condStyle = CONDITION_STYLES[cond] ?? { bg: "bg-white/10", text: "text-white/50" };

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-32">

      {/* Back button */}
      <div className="px-4 pt-5 pb-2">
        <button onClick={() => router.back()} className="text-white/50 text-sm flex items-center gap-2">
          ← Back
        </button>
      </div>

      {/* Photo Gallery */}
      <div className="mx-4">
        <PhotoGallery
          images={listing.image_urls ?? (listing.image_url ? [listing.image_url] : [])}
          alt={listing.title}
        />
      </div>

      {/* Info */}
      <div className="px-4 mt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-white font-bold text-xl flex-1">{listing.title}</h1>
          <span className="text-brand-yellow font-black text-2xl">₹{listing.price}</span>
        </div>

        {/* Badges */}
        <div className="flex gap-2 mt-3">
          {listing.size && (
            <span className="bg-white/10 text-white/70 text-xs font-bold px-3 py-1 rounded-full">
              Size {listing.size}
            </span>
          )}
          {listing.category && (
            <span className="bg-white/10 text-white/70 text-xs font-bold px-3 py-1 rounded-full">
              {listing.category}
            </span>
          )}
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${condStyle.bg} ${condStyle.text}`}>
            {cond}
          </span>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-white/50 text-sm mt-4 leading-relaxed">{listing.description}</p>
        )}

        {/* Seller */}
        <div className="mt-5 bg-brand-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow font-black text-lg">
            {listing.seller_alias?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{listing.seller_alias ?? "Anonymous"}</p>
            <p className="text-white/40 text-xs">{listing.seller_dept} · {listing.seller_year}</p>
          </div>
        </div>
      </div>

      {/* Action buttons — fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 bg-brand-dark border-t border-white/5 pt-3">
        <button className="w-full bg-brand-yellow text-black font-bold text-base py-4 rounded-2xl mb-2">
          Buy Now
        </button>
        <div className="flex gap-3">
          <button className="flex-1 bg-brand-card border border-white/10 text-white font-semibold text-sm py-3 rounded-2xl">
            💬 Message
          </button>
          <button className="flex-1 bg-brand-card border border-white/10 text-white font-semibold text-sm py-3 rounded-2xl">
            🤝 Make Offer
          </button>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
