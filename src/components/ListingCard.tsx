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

const GRAD: Record<string, string> = {
  tops: "linear-gradient(145deg,#121218,#1a1a2e)",
  bottoms: "linear-gradient(145deg,#121212,#1e1e2e)",
  shoes: "linear-gradient(145deg,#14140f,#222218)",
  bags: "linear-gradient(145deg,#121216,#1a1a28)",
  accessories: "linear-gradient(145deg,#181218,#261a28)",
  outerwear: "linear-gradient(145deg,#121612,#1a2218)",
};

const EMOJI: Record<string, string> = {
  tops: "👕", bottoms: "👖", shoes: "👟",
  bags: "👜", accessories: "💍", outerwear: "🧥",
};

const COND: Record<string, string> = {
  like_new: "Like New", good: "Good", fair: "Fair", new: "New",
};

/* ── inject styles once ── */
let _css = false;

export default function ListingCard({ listing }: { listing: Listing }) {
  const [liked, setLiked] = useState(listing.is_liked ?? false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sweepX, setSweepX] = useState(50);
  const [hov, setHov] = useState(false);
  const [fine, setFine] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setFine(mq.matches);
    if (_css || document.getElementById("lc-css")) return;
    _css = true;
    const s = document.createElement("style");
    s.id = "lc-css";
    s.textContent = STYLES;
    document.head.appendChild(s);
  }, []);

  const cat = (listing.category || "").toLowerCase();
  const condLabel = COND[(listing.condition || "").toLowerCase()] || listing.condition || "";
  const sellerDisplay = listing.seller_alias
    ? (listing.seller_alias.startsWith("@") ? listing.seller_alias : `@${listing.seller_alias}`)
    : "";

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current || !fine) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    setTilt({ x: (ny - 0.5) * -2, y: (nx - 0.5) * 2 });
    setSweepX(nx * 100);
  };

  const onEnter = () => { if (fine) setHov(true); };
  const onLeave = () => { setHov(false); setTilt({ x: 0, y: 0 }); setSweepX(50); };

  return (
    <Link href={`/listing/${listing.id}`} className="lc">
      <div
        ref={ref}
        className={`lc__card ${hov ? "lc__card--h" : ""}`}
        style={fine ? {
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: hov
            ? "transform .05s linear, box-shadow .35s, border-color .3s"
            : "transform .4s cubic-bezier(.34,1.56,.64,1), box-shadow .35s, border-color .3s",
        } : undefined}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {/* ── IMAGE ── */}
        <div className="lc__vis">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="lc__img"
              loading="lazy"
            />
          ) : (
            <div className="lc__ph" style={{ background: GRAD[cat] || GRAD.tops }}>
              <span className="lc__emoji">{EMOJI[cat] || "👗"}</span>
              <div className="lc__ph-grid" />
            </div>
          )}

          {/* Chrome light sweep following cursor */}
          <div
            className="lc__sweep"
            style={{
              left: `${sweepX - 25}%`,
              opacity: hov ? 1 : 0,
            }}
          />

          {/* Verified badge */}
          <span className="lc__badge">
            <span className="lc__badge-dot" />
            VERIFIED
          </span>

          {/* Like button */}
          <button
            className={`lc__heart ${liked ? "lc__heart--on" : ""}`}
            aria-label="Save listing"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked(!liked);
            }}
          >
            {liked ? "♥" : "♡"}
          </button>

          {/* Size overlay */}
          {listing.size && (
            <span className="lc__size">SIZE {listing.size.toUpperCase()}</span>
          )}
        </div>

        {/* ── BODY ── */}
        <div className="lc__body">
          <span className="lc__title">{listing.title}</span>
          <span className="lc__price">₹{listing.price}</span>
          {(listing.size || condLabel) && (
            <span className="lc__meta">
              {listing.size && `Size ${listing.size}`}
              {listing.size && condLabel && " · "}
              {condLabel}
            </span>
          )}
          {sellerDisplay && (
            <span className="lc__seller">
              {sellerDisplay}{listing.seller_dept ? ` · ${listing.seller_dept}` : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */

const STYLES = `
/* ── Link wrapper ── */
.lc{
  display:block;text-decoration:none;
  outline:none;
}
.lc:focus-visible .lc__card{
  outline:2px solid #E5FF00;outline-offset:2px;
}

/* ── Card ── */
.lc__card{
  background:#151515;
  border:1px solid #292929;
  border-radius:16px;
  overflow:hidden;
  will-change:transform;
}
.lc__card--h{
  border-color:rgba(229,255,0,.12);
  box-shadow:
    0 18px 48px rgba(0,0,0,.45),
    0 0 0 1px rgba(229,255,0,.04);
}

/* ── Visual area ── */
.lc__vis{
  position:relative;overflow:hidden;
  aspect-ratio:3/4;
}
.lc__img{
  width:100%;height:100%;
  object-fit:cover;display:block;
  transition:transform .5s cubic-bezier(.34,1.56,.64,1);
}
.lc__card--h .lc__img{transform:scale(1.04)}

/* ── Placeholder ── */
.lc__ph{
  width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;
  position:relative;
}
.lc__emoji{
  font-size:3rem;opacity:.2;
  transition:transform .4s cubic-bezier(.34,1.56,.64,1),opacity .4s;
}
.lc__card--h .lc__emoji{transform:scale(1.1);opacity:.28}
.lc__ph-grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);
  background-size:22px 22px;
  pointer-events:none;
}

/* ── Chrome sweep ── */
.lc__sweep{
  position:absolute;top:0;
  width:50%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(191,195,199,.08),transparent);
  pointer-events:none;
  transition:opacity .35s;
  z-index:2;
}

/* ── Verified badge ── */
.lc__badge{
  position:absolute;top:10px;left:10px;z-index:3;
  display:inline-flex;align-items:center;gap:5px;
  font-size:8px;letter-spacing:.18em;font-weight:700;
  padding:4px 10px 4px 8px;border-radius:100px;
  background:rgba(0,0,0,.55);
  backdrop-filter:blur(8px);
  color:rgba(255,255,255,.7);
}
.lc__badge-dot{
  width:5px;height:5px;border-radius:50%;
  background:#E5FF00;flex-shrink:0;
  box-shadow:0 0 4px rgba(229,255,0,.4);
}

/* ── Heart ── */
.lc__heart{
  position:absolute;top:10px;right:10px;z-index:3;
  width:30px;height:30px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:14px;
  background:rgba(0,0,0,.45);
  backdrop-filter:blur(8px);
  color:rgba(255,255,255,.75);
  border:none;outline:none;
  transition:all .25s cubic-bezier(.34,1.56,.64,1);
}
.lc__heart:hover{
  background:rgba(229,255,0,.15);
  color:#E5FF00;
  transform:scale(1.15);
}
.lc__heart:focus-visible{
  outline:2px solid #E5FF00;outline-offset:2px;
}
.lc__heart--on{
  color:#E5FF00;
  background:rgba(229,255,0,.12);
  text-shadow:0 0 8px rgba(229,255,0,.3);
}
.lc__heart--on:hover{
  background:rgba(229,255,0,.22);
  transform:scale(1.15);
}

/* ── Size overlay ── */
.lc__size{
  position:absolute;bottom:10px;right:10px;z-index:3;
  font-size:9px;letter-spacing:.18em;font-weight:600;
  padding:4px 10px;border-radius:8px;
  background:rgba(0,0,0,.55);
  backdrop-filter:blur(8px);
  color:#BFC3C7;
}

/* ── Body ── */
.lc__body{
  padding:14px 16px 16px;
  display:flex;flex-direction:column;gap:4px;
}
.lc__title{
  font-size:13px;font-weight:500;
  color:#F5F5F5;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.lc__price{
  font-family:'Bebas Neue',sans-serif;
  font-size:1.25rem;
  color:#E5FF00;
  letter-spacing:.03em;
  transition:color .3s;
}
.lc__card--h .lc__price{color:#F2FF4A}
.lc__meta{
  font-size:10px;
  color:#969696;
  letter-spacing:.02em;
}
.lc__seller{
  font-size:10px;
  color:#686D72;
}

/* ── Responsive ── */
@media(max-width:768px){
  .lc__vis{aspect-ratio:4/5}
  .lc__body{padding:10px 12px 12px}
  .lc__title{font-size:12px}
  .lc__price{font-size:1.1rem}
  .lc__heart{width:28px;height:28px;font-size:13px}
  .lc__badge{font-size:7px;padding:3px 8px 3px 6px}
  .lc__badge-dot{width:4px;height:4px}
  .lc__size{font-size:8px;padding:3px 8px}
}

/* ── Reduced motion ── */
@media(prefers-reduced-motion:reduce){
  .lc__card{transition:none!important;transform:none!important}
  .lc__img{transition:none!important}
  .lc__emoji{transition:none!important}
  .lc__heart{transition:none!important}
  .lc__sweep{display:none!important}
}
`;