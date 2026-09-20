"use client";

import { useEffect, useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import NotificationBell from "@/components/NotificationBell";
import { useFCMToken } from "@/hooks/useFCMToken";

/* ═══════════════════════ DATA ═══════════════════════ */

const CATEGORIES = ["All", "Tops", "Bottoms", "Shoes", "Bags", "Accessories"];

const EMOJI: Record<string, string> = {
  tops: "👕", bottoms: "👖", shoes: "👟",
  bags: "👜", accessories: "💍", outerwear: "🧥",
};

const GRAD: Record<string, string> = {
  tops: "linear-gradient(145deg,#121218,#1a1a2e)",
  bottoms: "linear-gradient(145deg,#121212,#1e1e2e)",
  shoes: "linear-gradient(145deg,#14140f,#222218)",
  bags: "linear-gradient(145deg,#121216,#1a1a28)",
  accessories: "linear-gradient(145deg,#181218,#261a28)",
  outerwear: "linear-gradient(145deg,#121612,#1a2218)",
};

const FALLBACK = [
  { id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M", condition: "Good", category: "Tops", seller_alias: "shadow_panda", seller_dept: "CSE" },
  { id: "2", title: "Levi's 511 Jeans", price: 599, size: "30", condition: "Like New", category: "Bottoms", seller_alias: "cool_tiger", seller_dept: "ECE" },
  { id: "3", title: "Nike Tanjun Sneakers", price: 799, size: "9", condition: "Good", category: "Shoes", seller_alias: "lazy_fox", seller_dept: "MBA" },
  { id: "4", title: "Zara Crop Jacket", price: 450, size: "S", condition: "Fair", category: "Outerwear", seller_alias: "quick_owl", seller_dept: "BCA" },
  { id: "5", title: "Formal Shirt White", price: 199, size: "L", condition: "Like New", category: "Tops", seller_alias: "wise_bear", seller_dept: "CSE" },
  { id: "6", title: "Palazzo Pants Black", price: 275, size: "XS", condition: "Good", category: "Bottoms", seller_alias: "bold_lynx", seller_dept: "BBA" },
];

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function HomeFeed() {
  /* ── Existing state (UNCHANGED) ── */
  const [listings, setListings] = useState<any[]>([]);
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  useFCMToken();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const PAGE_SIZE = 20;

  /* ── Existing fetch (UNCHANGED) ── */
  const fetchListings = async (cat: string, pageNum: number, replace: boolean) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let query = supabase
      .from("listings")
      .select("id, title, price, condition, category, images, image_url, seller:users(alias, college)")
      .eq("status", "active")
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    if (cat !== "All") query = query.eq("category", cat.toLowerCase());
    const { data, error } = await query;
    if (!data || data.length === 0) {
      if (pageNum === 0) setListings(FALLBACK);
      setHasMore(false);
    } else {
      const shaped = data.map((l: any) => ({
        ...l,
        image_url: l.image_url ?? l.images?.[0] ?? null,
        seller_alias: l.seller?.alias,
        seller_dept: l.seller?.college,
      }));
      setListings(prev => replace ? shaped : [...prev, ...shaped]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  };

  /* ── Existing effects (UNCHANGED) ── */
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchListings(category, 0, true);
  }, [category]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchListings(category, next, false);
  };

  /* ═══ NEW UI STATE ═══ */
  const [hasHover, setHasHover] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [entered, setEntered] = useState(false);
  const [mouse, setMouse] = useState({ x: -200, y: -200 });
  const [curMode, setCurMode] = useState<"default" | "product" | "cta">("default");
  const [curText, setCurText] = useState("");

  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const curModeRef = useRef<"default" | "product" | "cta">("default");
  const haloPos = useRef({ x: -200, y: -200 });
  const rafId = useRef(0);

  /* ── Hover + reduced-motion detection ── */
  useEffect(() => {
    const hq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasHover(hq.matches);
    const hFn = (e: MediaQueryListEvent) => setHasHover(e.matches);
    hq.addEventListener("change", hFn);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const rFn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", rFn);
    return () => { hq.removeEventListener("change", hFn); mq.removeEventListener("change", rFn); };
  }, []);

  /* ── Subtle entrance ── */
  useEffect(() => {
    if (reduced) { setEntered(true); return; }
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, [reduced]);

  /* ── Sync curMode ── */
  useEffect(() => { curModeRef.current = curMode; }, [curMode]);

  /* ── Mouse ── */
  useEffect(() => {
    if (!hasHover) return;
    const fn = (e: MouseEvent) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMouse(pos);
      mouseRef.current = pos;
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, [hasHover]);

  /* ── Cursor rAF ── */
  useEffect(() => {
    if (!hasHover || reduced) return;
    const loop = () => {
      const t = mouseRef.current;
      if (dotRef.current) {
        dotRef.current.style.left = `${t.x - 8}px`;
        dotRef.current.style.top = `${t.y - 8}px`;
      }
      const dx = t.x - haloPos.current.x;
      const dy = t.y - haloPos.current.y;
      haloPos.current.x += dx * 0.11;
      haloPos.current.y += dy * 0.11;
      if (haloRef.current) {
        const m = curModeRef.current;
        const s = m === "product" ? 1.6 : m === "cta" ? 1.36 : 1;
        haloRef.current.style.transform =
          `translate(${haloPos.current.x - 24}px,${haloPos.current.y - 24}px) scale(${s})`;
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [hasHover, reduced]);

  /* ── Scroll ── */
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── Derived ── */
  const showCursor = hasHover && !reduced;
  const navCompact = scrollY > 40;

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Cursor */}
      {showCursor && (
        <>
          <div ref={dotRef} className="cd" />
          <div ref={haloRef} className={`ch ch--${curMode}`}>
            {curMode === "product" && <span className="cl">{curText}</span>}
            {curMode === "cta" && <span className="cl cla">→</span>}
          </div>
        </>
      )}

      <main className="hf grain">

        {/* ── HEADER ── */}
        <header className={`hf__hdr ${navCompact ? "hf__hdr--c" : ""}`}>
          <div className="hf__hdr-in">
            <Link href="/" className="hf__brand">DRENZ</Link>
            <span className="hf__campus-tag">KIIT</span>
            <nav className="hf__nav">
              <Link href="/explore" className="hf__nav-l">Explore</Link>
              <Link href="/sell" className="hf__nav-l hf__nav-l--sell"
                onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
                onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
                Sell
              </Link>
              <Link href="/messages" className="hf__nav-l">Messages</Link>
              <Link href="/profile" className="hf__nav-l">Profile</Link>
            </nav>
            <div className="hf__hdr-r">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* ── CAMPUS CONTEXT + SEARCH ── */}
        <section className={`hf__top ${entered ? "hf__top--on" : ""}`}>
          <div className="hf__ctx">
            <h2 className="hf__ctx-t">YOUR CAMPUS CLOSET</h2>
            <p className="hf__ctx-s">Fresh pieces from your campus.</p>
          </div>
          <div className="hf__search">
            <svg className="hf__search-ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input type="text" placeholder="Search clothes, brands, categories..." className="hf__search-in" />
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <div className={`hf__cats ${entered ? "hf__cats--on" : ""}`}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`hf__cat ${category === cat ? "hf__cat--on" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── LOADING SKELETON ── */}
        {loading && listings.length === 0 && (
          <div className="hf__grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`hf__skel ${i === 0 ? "hf__skel--feat" : ""}`}>
                <div className="hf__skel-img" />
                <div className="hf__skel-body">
                  <div className="hf__skel-ln hf__skel-ln--w" />
                  <div className="hf__skel-ln hf__skel-ln--p" />
                  <div className="hf__skel-ln hf__skel-ln--s" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PRODUCT GRID ── */}
        {listings.length > 0 && (
          <div className="hf__grid">
            {listings.map((listing, i) => {
              const catKey = (listing.category || "").toLowerCase();
              return (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className={`hf__card ${i === 0 ? "hf__card--feat" : ""}`}
                  style={{ animationDelay: `${0.06 + i * 0.055}s` }}
                  onMouseEnter={() => { setCurMode("product"); setCurText("VIEW"); curModeRef.current = "product"; }}
                  onMouseLeave={() => { setCurMode("default"); setCurText(""); curModeRef.current = "default"; }}
                >
                  <div className="hf__card-vis">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt={listing.title} className="hf__card-img" />
                    ) : (
                      <div className="hf__card-ph" style={{ background: GRAD[catKey] || GRAD.tops }}>
                        <span className="hf__card-e">{EMOJI[catKey] || "👗"}</span>
                      </div>
                    )}
                    <span className="hf__card-tag">VERIFIED</span>
                    <button onClick={e => e.preventDefault()} className="hf__card-heart">♡</button>
                    <div className="hf__card-sweep" />
                  </div>
                  <div className="hf__card-body">
                    <span className="hf__card-name">{listing.title}</span>
                    <span className="hf__card-price">₹{listing.price}</span>
                    <span className="hf__card-meta">
                      {[listing.size, listing.condition].filter(Boolean).join(" · ")}
                    </span>
                    <span className="hf__card-seller">
                      {listing.seller_alias}{listing.seller_dept ? ` · ${listing.seller_dept}` : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && listings.length === 0 && (
          <div className="hf__empty">
            <h3 className="hf__empty-t">NO FRESH DROPS YET.</h3>
            <p className="hf__empty-d">Be the first to list something on campus.</p>
            <Link href="/sell" className="hf__empty-cta"
              onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
              onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
              SELL SOMETHING <span>→</span>
            </Link>
          </div>
        )}

        {/* ── LOAD MORE ── */}
        {hasMore && !loading && listings.length > 0 && (
          <div className="hf__more">
            <button onClick={loadMore} className="hf__more-btn"
              onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
              onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
              LOAD MORE <span className="hf__more-arr">→</span>
            </button>
          </div>
        )}

        {/* ── LOADING MORE (when paginating) ── */}
        {loading && listings.length > 0 && (
          <div className="hf__lm">
            <div className="hf__lm-dot" />
            <div className="hf__lm-dot" />
            <div className="hf__lm-dot" />
          </div>
        )}

        {/* Bottom Nav wrapper — hidden on desktop */}
        <div className="hf__bn">
          <BottomNav />
        </div>
      </main>
    </>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */

const STYLES = `
:root{
  --bg:#080808;--bg2:#111;--card:#151515;
  --y:#E5FF00;--yb:#F2FF4A;
  --t:#F5F5F5;--m:#969696;
  --ch:#BFC3C7;--cd:#686D72;
  --b:#292929;
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  background:var(--bg);color:var(--t);
  font-family:'DM Mono',monospace;
  overflow-x:hidden;
}
@media(hover:hover){body{cursor:none!important}}
a{color:inherit;text-decoration:none}
button{background:none;border:none;color:inherit;font:inherit}
@media(hover:hover){a,button,div,input,label{cursor:none!important}}
@media(hover:none){a,button{cursor:pointer}}

/* ── GRAIN ── */
.grain::before{
  content:'';position:fixed;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity:.025;pointer-events:none;z-index:9000;mix-blend-mode:overlay;
}

/* ═══ CURSOR ═══ */
.cd{
  position:fixed;left:-100px;top:-100px;
  width:16px;height:16px;border-radius:50%;
  background:#E5FF00;border:3px solid rgba(255,255,255,.92);
  pointer-events:none;z-index:2147483647;
  box-shadow:
    0 0 0 1px rgba(0,0,0,.3),
    0 0 4px 1px #E5FF00,
    0 0 14px 5px rgba(229,255,0,.65),
    0 0 36px 10px rgba(229,255,0,.28),
    0 0 70px 20px rgba(229,255,0,.08);
}
.ch{
  position:fixed;width:48px;height:48px;border-radius:50%;
  border:2px solid rgba(255,255,255,.24);
  background:rgba(229,255,0,.02);
  pointer-events:none;z-index:2147483646;
  will-change:transform;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 14px rgba(229,255,0,.06),inset 0 0 14px rgba(229,255,0,.03);
  transition:border-color .3s,background .3s,box-shadow .3s;
}
.ch--product{
  border-color:rgba(229,255,0,.38);
  background:rgba(229,255,0,.07);
  box-shadow:0 0 22px rgba(229,255,0,.14),inset 0 0 22px rgba(229,255,0,.06);
}
.ch--cta{
  background:#E5FF00;border-color:#E5FF00;
  box-shadow:0 0 28px rgba(229,255,0,.35),0 0 60px rgba(229,255,0,.08);
}
.cl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;font-weight:500;color:var(--t);user-select:none;white-space:nowrap}
.cla{color:#000;font-size:14px}

/* ═══ HEADER ═══ */
.hf__hdr{
  position:sticky;top:0;z-index:100;
  padding:16px 24px;
  transition:all .4s cubic-bezier(.34,1.56,.64,1);
}
.hf__hdr--c{
  padding:12px 24px;
  background:rgba(8,8,8,.92);
  backdrop-filter:blur(20px) saturate(1.5);
  border-bottom:1px solid var(--b);
}
.hf__hdr-in{
  max-width:1400px;margin:0 auto;
  display:flex;align-items:center;gap:32px;
}
.hf__brand{
  font-family:'Bebas Neue',sans-serif;
  font-size:1.4rem;letter-spacing:.2em;
  transition:color .3s;flex-shrink:0;
}
.hf__brand:hover{color:var(--y)}
.hf__campus-tag{
  display:none;
  font-size:9px;letter-spacing:.2em;
  padding:4px 12px;border:1px solid var(--b);
  border-radius:100px;color:var(--m);
}
.hf__nav{
  display:flex;gap:28px;
  font-size:11px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--m);
  flex:1;
}
.hf__nav-l{transition:color .3s;position:relative}
.hf__nav-l::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:1px;background:var(--y);transition:width .3s}
.hf__nav-l:hover{color:var(--t)}
.hf__nav-l:hover::after{width:100%}
.hf__nav-l--sell{color:var(--y);font-weight:600}
.hf__nav-l--sell:hover{color:var(--yb)}
.hf__hdr-r{margin-left:auto;display:flex;align-items:center;gap:12px}

@media(max-width:768px){
  .hf__hdr{padding:14px 16px}
  .hf__hdr--c{padding:10px 16px}
  .hf__nav{display:none}
  .hf__campus-tag{display:inline-block}
}

/* ═══ TOP SECTION (campus context + search) ═══ */
.hf__top{
  max-width:1400px;margin:0 auto;
  padding:24px 24px 0;
  opacity:0;transform:translateY(12px);
  transition:opacity .5s ease,transform .5s ease;
}
.hf__top--on{opacity:1;transform:translateY(0);transition-delay:.06s}

.hf__ctx{margin-bottom:20px}
.hf__ctx-t{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(1.3rem,3vw,1.8rem);
  letter-spacing:.06em;
}
.hf__ctx-s{font-size:12px;color:var(--m);margin-top:4px;letter-spacing:.04em}

.hf__search{
  display:flex;align-items:center;gap:12px;
  background:var(--bg2);
  border:1px solid var(--b);
  border-radius:14px;
  padding:14px 18px;
  transition:border-color .3s,box-shadow .3s;
}
.hf__search:focus-within{
  border-color:rgba(229,255,0,.3);
  box-shadow:0 0 0 3px rgba(229,255,0,.06);
}
.hf__search-ic{color:var(--cd);flex-shrink:0}
.hf__search-in{
  flex:1;background:none;border:none;outline:none;
  font-family:'DM Mono',monospace;
  font-size:13px;color:var(--t);
  letter-spacing:.02em;
}
.hf__search-in::placeholder{color:var(--cd)}

@media(max-width:768px){
  .hf__top{padding:16px 16px 0}
  .hf__ctx-t{font-size:1.2rem}
  .hf__search{padding:12px 14px;border-radius:12px}
  .hf__search-in{font-size:12px}
}

/* ═══ CATEGORIES ═══ */
.hf__cats{
  max-width:1400px;margin:0 auto;
  display:flex;gap:8px;overflow-x:auto;
  padding:20px 24px 8px;
  scrollbar-width:none;
  opacity:0;transform:translateY(12px);
  transition:opacity .5s ease,transform .5s ease;
}
.hf__cats::-webkit-scrollbar{display:none}
.hf__cats--on{opacity:1;transform:translateY(0);transition-delay:.12s}

.hf__cat{
  padding:10px 20px;border-radius:100px;
  font-size:11px;letter-spacing:.1em;
  font-family:'DM Mono',monospace;
  white-space:nowrap;
  border:1px solid var(--b);color:var(--m);
  transition:all .25s ease;
}
.hf__cat:hover{
  border-color:var(--ch);color:var(--t);
}
.hf__cat--on{
  background:var(--y);color:#000;
  border-color:var(--y);font-weight:600;
}
.hf__cat--on:hover{color:#000;border-color:var(--y)}

@media(max-width:768px){
  .hf__cats{padding:14px 16px 4px;gap:6px}
  .hf__cat{padding:8px 16px;font-size:10px}
}

/* ═══ GRID ═══ */
.hf__grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:14px;padding:24px 24px 0;
  max-width:1400px;margin:0 auto;
}
@media(min-width:768px){
  .hf__grid{grid-template-columns:repeat(3,1fr);gap:18px;padding:28px 24px 0}
}
@media(min-width:1024px){
  .hf__grid{grid-template-columns:repeat(4,1fr);gap:20px;padding:32px 24px 0}
}

/* ═══ CARD ═══ */
.hf__card{
  display:block;background:var(--card);
  border:1px solid var(--b);border-radius:16px;
  overflow:hidden;
  opacity:0;transform:translateY(24px);
  animation:cardIn .55s ease forwards;
  transition:box-shadow .35s ease,border-color .3s ease;
  text-decoration:none;
}
@keyframes cardIn{
  to{opacity:1;transform:translateY(0)}
}

/* Featured */
.hf__card--feat{grid-column:span 2}

@media(hover:hover){
  .hf__card:hover{
    transform:translateY(-5px);
    box-shadow:0 18px 48px rgba(0,0,0,.45);
    border-color:rgba(229,255,0,.1);
  }
}

/* ── Card visual ── */
.hf__card-vis{
  position:relative;overflow:hidden;
  height:200px;
}
.hf__card--feat .hf__card-vis{height:280px}

.hf__card-img{
  width:100%;height:100%;
  object-fit:cover;display:block;
  transition:transform .5s cubic-bezier(.34,1.56,.64,1);
}
@media(hover:hover){.hf__card:hover .hf__card-img{transform:scale(1.04)}}

.hf__card-ph{
  width:100%;height:100%;
  display:flex;align-items:center;justify-content:center;
}
.hf__card-e{
  font-size:2.8rem;
  transition:transform .4s cubic-bezier(.34,1.56,.64,1);
}
.hf__card--feat .hf__card-e{font-size:4rem}
@media(hover:hover){.hf__card:hover .hf__card-e{transform:scale(1.1)}}

.hf__card-tag{
  position:absolute;top:10px;left:10px;
  font-size:8px;letter-spacing:.18em;font-weight:700;
  padding:3px 10px;border-radius:100px;
  background:rgba(0,0,0,.55);backdrop-filter:blur(6px);
}
.hf__card-heart{
  position:absolute;top:10px;right:10px;
  width:28px;height:28px;border-radius:50%;
  background:rgba(0,0,0,.4);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;
  font-size:14px;color:var(--t);
  transition:all .25s ease;
}
.hf__card-heart:hover{background:var(--y);color:#000;transform:scale(1.12)}

.hf__card-sweep{
  position:absolute;top:0;left:-120%;
  width:50%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(191,195,199,.07),transparent);
  transition:left .6s ease;
  pointer-events:none;
}
@media(hover:hover){.hf__card:hover .hf__card-sweep{left:180%}}

/* ── Card body ── */
.hf__card-body{
  padding:14px 16px;display:flex;
  flex-direction:column;gap:3px;
}
.hf__card-name{
  font-size:12px;font-weight:500;color:var(--t);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.hf__card-price{
  font-family:'Bebas Neue',sans-serif;
  font-size:1.2rem;color:var(--y);letter-spacing:.03em;
}
.hf__card--feat .hf__card-price{font-size:1.4rem}
.hf__card-meta{font-size:10px;color:var(--m)}
.hf__card-seller{font-size:10px;color:var(--cd)}

@media(hover:hover){
  .hf__card:hover .hf__card-price{color:var(--yb)}
}

@media(max-width:768px){
  .hf__card-vis{height:170px}
  .hf__card--feat .hf__card-vis{height:210px}
  .hf__card-body{padding:10px 12px}
  .hf__card-price{font-size:1.05rem}
  .hf__card--feat .hf__card-price{font-size:1.2rem}
}

/* ═══ SKELETON ═══ */
.hf__skel{
  background:var(--card);border:1px solid var(--b);
  border-radius:16px;overflow:hidden;
}
.hf__skel--feat{grid-column:span 2}
.hf__skel-img{
  height:200px;
  background:linear-gradient(90deg,#151515 25%,#1a1a1a 50%,#151515 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s infinite;
}
.hf__skel--feat .hf__skel-img{height:280px}
.hf__skel-body{padding:14px 16px;display:flex;flex-direction:column;gap:8px}
.hf__skel-ln{
  height:10px;border-radius:6px;
  background:linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%);
  background-size:200% 100%;
  animation:shimmer 1.5s infinite;
}
.hf__skel-ln--w{width:75%}
.hf__skel-ln--p{width:35%;height:14px}
.hf__skel-ln--s{width:55%}
@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}

@media(max-width:768px){
  .hf__skel-img{height:170px}
  .hf__skel--feat .hf__skel-img{height:210px}
}

/* ═══ EMPTY STATE ═══ */
.hf__empty{
  text-align:center;padding:80px 24px;
  max-width:400px;margin:0 auto;
}
.hf__empty-t{
  font-family:'Bebas Neue',sans-serif;
  font-size:1.8rem;letter-spacing:.08em;
  margin-bottom:10px;
}
.hf__empty-d{font-size:12px;color:var(--m);margin-bottom:28px}
.hf__empty-cta{
  display:inline-flex;align-items:center;gap:8px;
  font-size:11px;letter-spacing:.14em;
  font-family:'DM Mono',monospace;
  padding:14px 28px;border-radius:100px;
  background:var(--y);color:#000;font-weight:500;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);
}
.hf__empty-cta:hover{
  transform:scale(1.05);
  box-shadow:0 0 30px rgba(229,255,0,.3);
}
.hf__empty-cta span{transition:transform .3s ease;display:inline-block}
.hf__empty-cta:hover span{transform:translateX(4px)}

/* ═══ LOAD MORE ═══ */
.hf__more{
  display:flex;justify-content:center;
  padding:36px 24px 0;
}
.hf__more-btn{
  font-family:'DM Mono',monospace;
  font-size:11px;letter-spacing:.14em;
  padding:14px 32px;border-radius:100px;
  border:1px solid var(--b);color:var(--m);
  display:inline-flex;align-items:center;gap:8px;
  transition:all .3s ease;
}
.hf__more-btn:hover{
  border-color:var(--ch);color:var(--t);
}
.hf__more-arr{transition:transform .3s ease;display:inline-block}
.hf__more-btn:hover .hf__more-arr{transform:translateX(4px)}

/* ═══ LOADING MORE (pagination dots) ═══ */
.hf__lm{
  display:flex;justify-content:center;gap:6px;
  padding:36px 24px 0;
}
.hf__lm-dot{
  width:6px;height:6px;border-radius:50%;
  background:var(--cd);
  animation:lmPulse 1s infinite;
}
.hf__lm-dot:nth-child(1){animation-delay:0s}
.hf__lm-dot:nth-child(2){animation-delay:.2s}
.hf__lm-dot:nth-child(3){animation-delay:.4s}
@keyframes lmPulse{0%,60%,100%{opacity:.2}30%{opacity:1}}

/* ═══ BOTTOM NAV WRAPPER ═══ */
.hf__bn{
  position:fixed;bottom:0;left:0;right:0;
  z-index:90;
}
@media(min-width:769px){.hf__bn{display:none}}

/* ═══ MAIN LAYOUT ═══ */
.hf{
  min-height:100vh;
  background:var(--bg);
  padding-bottom:96px;
}
@media(min-width:769px){.hf{padding-bottom:48px}}

/* ═══ REDUCED MOTION ═══ */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    transition-duration:.01ms!important;
  }
  .cd,.ch{display:none!important}
  .hf__card{opacity:1!important;transform:none!important}
}
`;