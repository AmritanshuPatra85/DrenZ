"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

type Listing = {
  id: string;
  title: string;
  price: number;
  size?: string;
  condition?: string;
  category?: string;
  seller_alias?: string;
  seller_dept?: string;
  image_url?: string;
  is_liked?: boolean;
};

const COND: Record<string, string> = {
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  new: "New",
};

const GRAD: Record<string, string> = {
  tops: "linear-gradient(145deg,#121218,#1a1a2e)",
  bottoms: "linear-gradient(145deg,#121212,#1e1e2e)",
  shoes: "linear-gradient(145deg,#14140f,#222218)",
  bags: "linear-gradient(145deg,#121216,#1a1a28)",
  accessories: "linear-gradient(145deg,#181218,#261a28)",
  outerwear: "linear-gradient(145deg,#121612,#1a2218)",
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const [liked, setLiked] = useState(listing.is_liked ?? false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sweepX, setSweepX] = useState(50);
  const [hov, setHov] = useState(false);
  const [fine, setFine] = useState(false);
  const [reduced, setReduced] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setFine(mq.matches);
    const mqR = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mqR.matches);
  }, []);

  const cat = (listing.category || "").toLowerCase();
  const condLabel =
    COND[(listing.condition || "").toLowerCase()] ||
    listing.condition ||
    "";
  const sellerDisplay = listing.seller_alias
    ? listing.seller_alias.startsWith("@")
      ? listing.seller_alias
      : `@${listing.seller_alias}`
    : "";
  const interactive = fine && !reduced;

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current || !interactive) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    setTilt({ x: (ny - 0.5) * -1.5, y: (nx - 0.5) * 1.5 });
    setSweepX(nx * 100);
  };

  const onEnter = () => {
    if (interactive) setHov(true);
  };

  const onLeave = () => {
    setHov(false);
    setTilt({ x: 0, y: 0 });
    setSweepX(50);
  };

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#E5FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808]"
    >
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl bg-[#151515] border border-[#292929] will-change-transform"
        style={
          interactive
            ? {
                transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: hov
                  ? "transform .05s linear, box-shadow .35s, border-color .3s"
                  : "transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .35s, border-color .3s",
                borderColor: hov
                  ? "rgba(229,255,0,0.1)"
                  : undefined,
                boxShadow: hov
                  ? "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(229,255,0,0.03)"
                  : undefined,
              }
            : undefined
        }
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {/* ── IMAGE ── */}
        <div className="relative overflow-hidden aspect-[4/5]">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover block transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{
                transform: hov ? "scale(1.04)" : "scale(1)",
              }}
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full relative flex items-center justify-center"
              style={{ background: GRAD[cat] || GRAD.tops }}
            >
              {/* Subtle grid pattern */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              {/* Monochrome geometric icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-[#686D72] opacity-20"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </div>
          )}

          {/* Chrome sweep */}
          {interactive && (
            <div
              className="absolute top-0 w-1/2 h-full pointer-events-none z-[2] transition-opacity duration-300"
              style={{
                left: `${sweepX - 25}%`,
                opacity: hov ? 1 : 0,
                background:
                  "linear-gradient(90deg, transparent, rgba(191,195,199,0.06), transparent)",
              }}
            />
          )}

          {/* Verified badge */}
          <span className="absolute top-2.5 left-2.5 z-[3] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[8px] tracking-[0.18em] font-bold text-[#BFC3C7]">
            <span className="w-[5px] h-[5px] rounded-full bg-[#E5FF00] shadow-[0_0_4px_rgba(229,255,0,0.4)] flex-shrink-0" />
            VERIFIED
          </span>

          {/* Heart / Like */}
          <button
            className={`absolute top-2.5 right-2.5 z-[3] w-[30px] h-[30px] rounded-full flex items-center justify-center border-none outline-none backdrop-blur-md transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 focus-visible:ring-2 focus-visible:ring-[#E5FF00] ${
              liked
                ? "bg-[#E5FF00]/15 text-[#E5FF00] shadow-[0_0_8px_rgba(229,255,0,0.3)]"
                : "bg-black/40 text-white/70 hover:bg-[#E5FF00]/15 hover:text-[#E5FF00]"
            }`}
            aria-label={liked ? "Remove from saved" : "Save listing"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked(!liked);
            }}
          >
            <svg
              width="14"
              height="14"
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

          {/* Size badge */}
          {listing.size && (
            <span className="absolute bottom-2.5 right-2.5 z-[3] inline-flex items-center px-2.5 py-1 rounded-md bg-black/50 backdrop-blur-md text-[9px] tracking-[0.16em] font-semibold text-[#BFC3C7]">
              SIZE {listing.size.toUpperCase()}
            </span>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="px-3.5 py-3 flex flex-col gap-[3px]">
          <span className="text-[13px] font-medium text-[#F5F5F5] truncate">
            {listing.title}
          </span>
          <span className="text-lg font-bold text-[#E5FF00] tracking-[0.04em] leading-tight">
            ₹{listing.price}
          </span>
          {(listing.size || condLabel) && (
            <span className="text-[10px] text-[#969696] tracking-wide">
              {listing.size && `Size ${listing.size}`}
              {listing.size && condLabel && " · "}
              {condLabel}
            </span>
          )}
          {sellerDisplay && (
            <span className="text-[10px] text-[#686D72]">
              {sellerDisplay}
              {listing.seller_dept ? ` · ${listing.seller_dept}` : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}