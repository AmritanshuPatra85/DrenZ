"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

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

  const images = listing?.image_urls ?? (listing?.image_url ? [listing.image_url] : []);
  const isOwner = currentUser?.id === listing?.seller_id;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-32">
        <div className="mx-auto max-w-6xl px-4 md:px-8 pt-6">
          <div className="h-4 w-16 bg-[#292929] rounded animate-pulse mb-6" />
          <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div className="aspect-[4/5] bg-[#111111] rounded-xl animate-pulse" />
            <div className="mt-6 lg:mt-0 space-y-4">
              <div className="h-3 w-16 bg-[#292929] rounded animate-pulse" />
              <div className="h-7 w-3/4 bg-[#292929] rounded animate-pulse" />
              <div className="h-9 w-28 bg-[#292929] rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-[#292929] rounded-full animate-pulse" />
                <div className="h-7 w-16 bg-[#292929] rounded-full animate-pulse" />
              </div>
              <div className="h-16 w-full bg-[#292929] rounded-lg animate-pulse" />
              <div className="h-16 w-full bg-[#292929] rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  if (!listing) return null;

  const condLabel = (listing.condition || "").replace("_", " ");

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-32 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8 pt-4 lg:pt-8">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5 lg:mb-8">
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
          <span
            className="text-sm tracking-[0.2em] text-[#686D72]"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            DRENZ
          </span>
        </div>

        {/* ── Two-column layout ── */}
        <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-14">

          {/* ═══ LEFT: IMAGE GALLERY ═══ */}
          <div className="relative lg:sticky lg:top-8">
            {/* Like button — desktop top-right of image */}
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={toggleLike}
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  backdrop-blur-md border transition-all duration-200
                  ${liked
                    ? "bg-[#E5FF00]/15 border-[#E5FF00]/20 text-[#E5FF00]"
                    : "bg-black/50 border-white/[0.06] text-white/70 hover:text-white hover:border-white/10"
                  }
                `}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill={liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* Image container */}
            <div
              className="relative w-full overflow-hidden rounded-xl border border-[#292929] bg-[#111111]"
              onTouchStart={(e) => {
                const touch = e.touches[0];
                (e.currentTarget as any)._touchStartX = touch.clientX;
              }}
              onTouchEnd={(e) => {
                const startX = (e.currentTarget as any)._touchStartX;
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                if (Math.abs(diff) > 50) {
                  if (diff > 0 && imgIndex < images.length - 1) setImgIndex(imgIndex + 1);
                  if (diff < 0 && imgIndex > 0) setImgIndex(imgIndex - 1);
                }
              }}
            >
              {images.length > 0 ? (
                <div className="aspect-[4/5]">
                  <img
                    src={images[imgIndex]}
                    alt={`${listing.title} photo ${imgIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-[4/5] flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                    }}
                  />
                  <div className="relative flex flex-col items-center gap-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round" className="text-[#686D72] opacity-20">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-[10px] tracking-[0.2em] text-[#686D72] uppercase">
                      No image available
                    </span>
                  </div>
                </div>
              )}

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  {imgIndex > 0 && (
                    <button
                      onClick={() => setImgIndex(imgIndex - 1)}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-[#BFC3C7] transition-all duration-200 hover:bg-black/70 hover:text-white hover:scale-105 active:scale-95"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                  )}
                  {imgIndex < images.length - 1 && (
                    <button
                      onClick={() => setImgIndex(imgIndex + 1)}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-[#BFC3C7] transition-all duration-200 hover:bg-black/70 hover:text-white hover:scale-105 active:scale-95"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {/* Photo count */}
              {images.length > 1 && (
                <div className="absolute top-3 left-3 flex items-center bg-black/50 backdrop-blur-md rounded-md px-2.5 py-1 border border-white/[0.06]">
                  <span className="text-[10px] tracking-[0.14em] text-[#BFC3C7] font-medium">
                    {String(imgIndex + 1).padStart(2, "0")}&nbsp;/&nbsp;{String(images.length).padStart(2, "0")}
                  </span>
                </div>
              )}

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {images.map((_: any, i: number) => (
                    <button
                      key={i}
                      aria-label={`View photo ${i + 1}`}
                      onClick={() => setImgIndex(i)}
                      className={`rounded-full transition-all duration-200 ${
                        i === imgIndex
                          ? "bg-[#E5FF00] w-4 h-1.5"
                          : "bg-white/30 w-1.5 h-1.5 hover:bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT: PRODUCT INFO ═══ */}
          <div className="mt-6 lg:mt-0">

            {/* Category */}
            {listing.category && (
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-2">
                {listing.category}
              </span>
            )}

            {/* Title */}
            <h1 className="text-xl lg:text-2xl font-bold leading-tight text-[#F5F5F5]">
              {listing.title}
            </h1>

            {/* Price */}
            <p className="mt-3 text-3xl lg:text-4xl font-bold text-[#E5FF00] tracking-tight">
              ₹{listing.price}
            </p>

            {/* Condition + Category pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {listing.condition && (
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase px-3 py-1.5 rounded-lg bg-[#151515] border border-[#292929] text-[#BFC3C7]">
                  {condLabel}
                </span>
              )}
              {listing.category && (
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase px-3 py-1.5 rounded-lg bg-[#151515] border border-[#292929] text-[#969696]">
                  {listing.category}
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="mt-6 border-t border-[#292929] pt-5">
                <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
                  DETAILS
                </span>
                <p className="text-sm text-[#969696] leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Seller */}
            <div className="mt-6 border-t border-[#292929] pt-5">
              <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
                SELLER
              </span>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#151515] border border-[#292929] flex items-center justify-center text-[#E5FF00] font-bold text-base">
                  {listing.seller?.alias?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#F5F5F5] truncate">
                    @{listing.seller?.alias ?? "Unknown"}
                  </p>
                  <p className="text-[11px] text-[#686D72]">
                    {listing.seller?.college ?? ""}
                  </p>
                </div>
                <span className="text-[10px] text-[#686D72] tracking-wide shrink-0">
                  {new Date(listing.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            </div>

            {/* Buyer Protection */}
            <div className="mt-6 border-t border-[#292929] pt-5">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#111111] border border-[#292929]">
                <div className="shrink-0 mt-0.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#969696]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#BFC3C7] tracking-wide">
                    BUYER PROTECTED
                  </p>
                  <p className="text-[11px] text-[#686D72] leading-relaxed mt-1">
                    Identity revealed only after payment. Money held until meetup.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Action buttons (desktop — inside right column) ── */}
            <div className="hidden lg:block mt-8">
              {isOwner ? (
                <div className="flex gap-3">
                  <Link
                    href={`/sell?edit=${listing.id}`}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    EDIT LISTING
                  </Link>
                  <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#2a1215] border border-[#3d1a1a] text-[#e55555] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:bg-[#351518]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    DELETE LISTING
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleMessage}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                    MESSAGE
                  </button>
                  <button
                    onClick={() => router.push(`/checkout/${listing.id}`)}
                    className="group flex-[1.6] flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
                  >
                    BUY NOW · ₹{listing.price}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed action bar ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3 bg-gradient-to-t from-[#080808] via-[#080808] to-[#080808]/0 lg:hidden z-40">
        {isOwner ? (
          <div className="flex gap-3">
            <Link
              href={`/sell?edit=${listing.id}`}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.1em]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              EDIT
            </Link>
            <button className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#2a1215] border border-[#3d1a1a] text-[#e55555] text-xs font-semibold tracking-[0.1em]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              DELETE
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleMessage}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.1em]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
              MESSAGE
            </button>
            <button
              onClick={() => router.push(`/checkout/${listing.id}`)}
              className="group flex-[1.6] flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] active:scale-[0.98]"
            >
              BUY NOW · ₹{listing.price}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}