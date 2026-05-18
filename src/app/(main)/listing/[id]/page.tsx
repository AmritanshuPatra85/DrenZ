"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const CATEGORY_STYLES: Record<string, { bg: string; emoji: string }> = {
  "tops":        { bg: "#1a2440", emoji: "👕" },
  "bottoms":     { bg: "#1a3020", emoji: "👖" },
  "shoes":       { bg: "#3a1a1a", emoji: "👟" },
  "bags":        { bg: "#3a2e10", emoji: "👜" },
  "accessories": { bg: "#2e1a3a", emoji: "💍" },
};
const DEFAULT_STYLE = { bg: "#1c1c12", emoji: "👗" };

const CONDITION_STYLES: Record<string, { bg: string; text: string }> = {
  "like_new": { bg: "bg-green-950",  text: "text-green-400"  },
  "good":     { bg: "bg-lime-950",   text: "text-lime-400"   },
  "fair":     { bg: "bg-orange-950", text: "text-orange-400" },
  "new":      { bg: "bg-blue-950",   text: "text-blue-400"   },
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing]         = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [liked, setLiked]             = useState(false);
  const [loading, setLoading]         = useState(true);
  const [imgIndex, setImgIndex]       = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data, error } = await supabase
        .from("listings")
        .select(`
          id, title, price, condition, category,
          image_url, image_urls, description, status, created_at,
          seller_id,
          seller:users(alias, college, id)
        `)
        .eq("id", id)
        .single();

      if (error || !data) { router.push("/home"); return; }
      setListing(data);

      if (user) {
        const { data: like } = await supabase
          .from("likes")
          .select("id")
          .eq("listing_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        setLiked(!!like);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  const toggleLike = async () => {
    if (!currentUser) return;
    setLiked(!liked);
    await fetch(`/api/listings/${id}/like`, { method: "POST" });
  };

  const handleMessage = async () => {
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", id)
      .eq("buyer_id", currentUser?.id)
      .maybeSingle();

    if (existing) { router.push(`/chat/${existing.id}`); return; }

    const { data: created } = await supabase
      .from("conversations")
      .insert({ listing_id: id, buyer_id: currentUser?.id, seller_id: listing.seller_id })
      .select("id")
      .single();

    if (created) router.push(`/chat/${created.id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-brand-dark flex items-center justify-center">
        <p className="text-white/30 text-sm">Loading…</p>
      </main>
    );
  }

  if (!listing) return null;

  const isOwner   = currentUser?.id === listing.seller_id;
  const catStyle  = CATEGORY_STYLES[listing.category] ?? DEFAULT_STYLE;
  const condStyle = CONDITION_STYLES[listing.condition] ?? { bg: "bg-white/10", text: "text-white/50" };
  const images    = listing.image_urls ?? (listing.image_url ? [listing.image_url] : []);

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-32">

      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="bg-black/60 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center text-white text-lg"
        >
          ←
        </button>
      </div>

      {/* Like button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleLike}
          className="bg-black/60 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center text-lg"
        >
          {liked ? "❤️" : "🤍"}
        </button>
      </div>

      {/* Photo */}
      <div
        className="w-full h-72 flex items-center justify-center relative"
        style={{ background: catStyle.bg }}
      >
        {images.length > 0 ? (
          <>
            <img
              src={images[imgIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? "bg-brand-yellow" : "bg-white/30"}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-7xl">{catStyle.emoji}</span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-4">

        {/* Title + price */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-white font-bold text-xl leading-tight flex-1">{listing.title}</h1>
          <span className="text-brand-yellow font-black text-2xl">₹{listing.price}</span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {listing.condition && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${condStyle.bg} ${condStyle.text}`}>
              {listing.condition.replace("_", " ")}
            </span>
          )}
          {listing.category && (
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-white/70 capitalize">
              {listing.category}
            </span>
          )}
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-white/60 text-sm leading-relaxed">{listing.description}</p>
        )}

        {/* Seller */}
        <div className="bg-brand-card border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow font-black text-lg">
            {listing.seller?.alias?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{listing.seller?.alias ?? "Unknown"}</p>
            <p className="text-white/40 text-xs">{listing.seller?.college ?? ""}</p>
          </div>
          <span className="text-white/20 text-xs">
            {new Date(listing.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>

        {/* Trust banner */}
        <div className="bg-green-950/50 border border-green-800/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-green-400 text-xl">🛡️</span>
          <div>
            <p className="text-green-400 text-xs font-bold">Buyer Protected</p>
            <p className="text-white/40 text-xs">Identity revealed only after payment. Money held until meetup.</p>
          </div>
        </div>

      </div>

      {/* CTA buttons */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent pt-4">
        {isOwner ? (
          <div className="flex gap-3">
            <Link
              href={`/sell?edit=${listing.id}`}
              className="flex-1 bg-white/10 text-white font-bold py-4 rounded-2xl text-center text-sm"
            >
              ✏️ Edit
            </Link>
            <button className="flex-1 bg-red-950 text-red-400 font-bold py-4 rounded-2xl text-sm">
              🗑️ Delete
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleMessage}
              className="flex-1 bg-white/10 text-white font-bold py-4 rounded-2xl text-sm border border-white/10"
            >
              💬 Message
            </button>
            <button
              onClick={() => router.push(`/checkout/${listing.id}`)}
              className="flex-1 bg-brand-yellow text-black font-black py-4 rounded-2xl text-sm"
            >
              Buy Now ₹{listing.price}
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}