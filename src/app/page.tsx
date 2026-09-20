"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";

/* ═══════════════════════ DATA ═══════════════════════ */

const CATEGORIES = [
  { label: "All", emoji: "" },
  { label: "Tops", emoji: "👕" },
  { label: "Bottoms", emoji: "👖" },
  { label: "Shoes", emoji: "👟" },
  { label: "Bags", emoji: "👜" },
  { label: "Accessories", emoji: "💍" },
];

const EMOJI: Record<string, string> = {
  Tops: "👕", Bottoms: "👖", Shoes: "👟",
  Bags: "👜", Accessories: "💍", Outerwear: "🧥",
};

const GRAD: Record<string, string> = {
  Tops: "linear-gradient(145deg,#121218,#1a1a2e)",
  Bottoms: "linear-gradient(145deg,#121212,#1e1e2a)",
  Shoes: "linear-gradient(145deg,#14140f,#222218)",
  Bags: "linear-gradient(145deg,#121216,#1a1a28)",
  Accessories: "linear-gradient(145deg,#181218,#261a28)",
  Outerwear: "linear-gradient(145deg,#121612,#1a2218)",
};

const FALLBACK = [
  { id: "1", title: "H&M Oversized Hoodie", price: 349, size: "M", condition: "Good", category: "Tops", seller_alias: "shadow_panda", seller_dept: "CSE" },
  { id: "2", title: "Levi's 511 Jeans", price: 599, size: "30", condition: "Like New", category: "Bottoms", seller_alias: "cool_tiger", seller_dept: "ECE" },
  { id: "3", title: "Nike Tanjun Sneakers", price: 799, size: "9", condition: "Good", category: "Shoes", seller_alias: "lazy_fox", seller_dept: "MBA" },
  { id: "4", title: "Zara Crop Jacket", price: 450, size: "S", condition: "Fair", category: "Outerwear", seller_alias: "quick_owl", seller_dept: "BCA" },
  { id: "5", title: "Formal Shirt White", price: 199, size: "L", condition: "Like New", category: "Tops", seller_alias: "wise_bear", seller_dept: "CSE" },
  { id: "6", title: "Palazzo Pants Black", price: 275, size: "XS", condition: "Good", category: "Bottoms", seller_alias: "bold_lynx", seller_dept: "BBA" },
  { id: "7", title: "Canvas Tote Bag", price: 149, size: "Free", condition: "Like New", category: "Bags", seller_alias: "pink_wolf", seller_dept: "BBA" },
  { id: "8", title: "Silver Hoop Earrings", price: 99, size: "Free", condition: "Good", category: "Accessories", seller_alias: "star_fox", seller_dept: "CSE" },
];

/* ═══════════════════════ HOOKS ═══════════════════════ */

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible } as const;
}

/* ═══════════════════════ PAGE ═══════════════════════ */

export default function LandingPage() {
  const [category, setCategory] = useState("All");
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<"init" | "dot" | "streak" | "word" | "split" | "done">("init");
  const [mouse, setMouse] = useState({ x: -200, y: -200 });
  const [curMode, setCurMode] = useState<"default" | "product" | "cta">("default");
  const [curText, setCurText] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [pxOn, setPxOn] = useState(false);

  /* ── FIX: use hover media query instead of broken touch/width detection ── */
  const [hasHover, setHasHover] = useState(true);

  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const curModeRef = useRef<"default" | "product" | "cta">("default");
  const haloPos = useRef({ x: -200, y: -200 });
  const rafId = useRef(0);

  const sTrend = useReveal();
  const sCampus = useReveal();
  const sFresh = useReveal();
  const sSell = useReveal();

  /* ── detect hover capability + reduced-motion ── */
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

  /* ── entrance sequence ── */
  useEffect(() => {
    if (reduced) { setPhase("done"); return; }
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase("dot"), 80));
    t.push(setTimeout(() => setPhase("streak"), 220));
    t.push(setTimeout(() => setPhase("word"), 460));
    t.push(setTimeout(() => setPhase("split"), 820));
    t.push(setTimeout(() => setPhase("done"), 1480));
    return () => t.forEach(clearTimeout);
  }, [reduced]);

  /* ── parallax enable ── */
  useEffect(() => {
    if (phase === "done") {
      const t = setTimeout(() => setPxOn(true), 250);
      return () => clearTimeout(t);
    }
  }, [phase]);

  /* ── sync curMode to ref ── */
  useEffect(() => { curModeRef.current = curMode; }, [curMode]);

  /* ── mouse tracking ── */
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

  /* ── FIX: single rAF loop positions BOTH dot and halo via refs ── */
  useEffect(() => {
    if (!hasHover || reduced) return;
    const loop = () => {
      const t = mouseRef.current;

      /* dot — instant, no spring */
      if (dotRef.current) {
        dotRef.current.style.left = `${t.x - 8}px`;
        dotRef.current.style.top  = `${t.y - 8}px`;
      }

      /* halo — spring lag */
      const dx = t.x - haloPos.current.x;
      const dy = t.y - haloPos.current.y;
      haloPos.current.x += dx * 0.11;
      haloPos.current.y += dy * 0.11;
      if (haloRef.current) {
        const m = curModeRef.current;
        const s = m === "product" ? 1.78 : m === "cta" ? 1.36 : 1;
        haloRef.current.style.transform =
          `translate(${haloPos.current.x - 24}px,${haloPos.current.y - 24}px) scale(${s})`;
      }

      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [hasHover, reduced]);

  /* ── scroll ── */
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── derived ── */
  const filtered = category === "All" ? FALLBACK : FALLBACK.filter(l => l.category === category);
  const navCompact = scrollY > 80;
  const showCursor = hasHover && !reduced;
  const heroReady = phase === "split" || phase === "done";
  const w = typeof window !== "undefined" ? window.innerWidth : 1440;
  const h = typeof window !== "undefined" ? window.innerHeight : 900;
  const px = pxOn ? (mouse.x - w / 2) / 90 : 0;
  const py = pxOn ? (mouse.y - h / 2) / 90 : 0;

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── FIX: Custom Cursor — now uses ref-based rAF positioning, never re-renders ── */}
      {showCursor && (
        <>
          <div ref={dotRef} className="cd" />
          <div ref={haloRef} className={`ch ch--${curMode}`}>
            {curMode === "product" && <span className="cl">{curText}</span>}
            {curMode === "cta" && <span className="cl cla">→</span>}
          </div>
        </>
      )}

      {/* ── Entrance ── */}
      {phase !== "done" && (
        <div className={`en en--${phase}`}>
          <div className={`en__h en__h--t ${phase === "split" ? "en__h--out" : ""}`}>
            <div className="en__tw">
              <span className={`en__w ${phase === "word" || phase === "split" ? "en__w--on" : ""}`}>DRENZ</span>
            </div>
          </div>
          <div className={`en__h en__h--b ${phase === "split" ? "en__h--out" : ""}`}>
            <div className="en__tw en__tw--b">
              <span className={`en__w ${phase === "word" || phase === "split" ? "en__w--on" : ""}`}>DRENZ</span>
            </div>
          </div>
          <div className="en__streak" />
          <div className="en__dot" />
          <div className="en__flash" />
          <div className="en__seam" />
        </div>
      )}

      {/* ═══ MAIN ═══ */}
      <main className="grain">

        {/* NAV */}
        <nav className={`nv ${navCompact ? "nv--c" : ""}`}>
          <Link href="/" className="nv__b">DRENZ</Link>
          <div className="nv__l">
            <Link href="/explore">Explore</Link>
            <Link href="/sell">Sell</Link>
            <Link href="/messages">Messages</Link>
            <Link href="/profile">Profile</Link>
          </div>
          <Link href="/login" className="nv__cta">Join Campus</Link>
        </nav>

        {/* HERO — shake applied when curtains split */}
        <section className={`hx ${phase === "split" ? "hx--shake" : ""}`}>
          <div className="hx__glow" style={pxOn ? { transform: `translate(${px * 3}px,${py * 3}px)` } : undefined} />
          <div className="hx__text" style={pxOn ? { transform: `translate(${px * 0.4}px,${py * 0.4}px)` } : undefined}>
            <div className={`hx__campus ${heroReady ? "v" : ""}`}>
              <span className="hx__badge">KIIT CAMPUS</span>
            </div>
            <h1 className={`hx__title ${heroReady ? "v" : ""}`}>
              <span className="hx__ln">YOUR</span>
              <span className="hx__ln hx__ln--y">CAMPUS</span>
              <span className="hx__ln hx__ln--o">CLOSET.</span>
            </h1>
            <p className={`hx__tag ${heroReady ? "v" : ""}`}>WEAR IT.&ensp;PASS IT.&ensp;LIST IT.</p>
            <div className={`hx__act ${heroReady ? "v" : ""}`}>
              <Link href="/explore" className="cta cta--p"
                onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
                onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
                EXPLORE CLOSET <span className="cta__a">→</span>
              </Link>
              <Link href="/sell" className="cta cta--g"
                onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
                onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
                SELL SOMETHING
              </Link>
            </div>
          </div>
          <div className={`hx__prods ${heroReady ? "hx__prods--in" : ""}`}
            style={pxOn ? { transform: `translate(${px * 1.8}px,${py * 1.8}px)` } : undefined}>
            {FALLBACK.slice(0, 4).map((item) => (
              <div key={item.id} className="hx__card"
                onMouseEnter={() => { setCurMode("product"); setCurText("VIEW"); curModeRef.current = "product"; }}
                onMouseLeave={() => { setCurMode("default"); setCurText(""); curModeRef.current = "default"; }}>
                <div className="hx__card-img" style={{ background: GRAD[item.category] || GRAD.Tops }}>
                  <span className="hx__card-e">{EMOJI[item.category] || "👗"}</span>
                </div>
                <div className="hx__card-m">
                  <span className="hx__card-n">{item.title}</span>
                  <span className="hx__card-p">₹{item.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="cc cc--1" style={pxOn ? { transform: `translate(${px * 4}px,${py * 4}px)` } : undefined} />
          <div className="cc cc--2" style={pxOn ? { transform: `translate(${-px * 3}px,${-py * 3}px)` } : undefined} />
        </section>

        {/* KINETIC */}
        <section className="ki">
          <div className="ki__t" style={{ transform: `translateX(${-scrollY * 0.25}px)` }}>
            {Array.from({ length: 4 }).map((_, r) => (
              <span key={r} className="ki__tx">{"WEAR IT → PASS IT → LIST IT → REPEAT → "}</span>
            ))}
          </div>
        </section>

        {/* TRENDING */}
        <section className="tr" ref={sTrend.ref}>
          <div className={`sh ${sTrend.visible ? "sh--in" : ""}`}>
            <span className="sn">01</span>
            <h2 className="st">TRENDING NOW</h2>
            <div className="sr" />
          </div>
          <div className={`tg ${sTrend.visible ? "tg--in" : ""}`}>
            <Link href="/login" className="tf"
              onMouseEnter={() => { setCurMode("product"); setCurText("VIEW"); curModeRef.current = "product"; }}
              onMouseLeave={() => { setCurMode("default"); setCurText(""); curModeRef.current = "default"; }}>
              <div className="tf__img" style={{ background: GRAD[FALLBACK[0].category] }}>
                <span className="tf__e">{EMOJI[FALLBACK[0].category]}</span>
              </div>
              <div className="tf__inf">
                <span className="tf__badge">VERIFIED</span>
                <span className="tf__nm">{FALLBACK[0].title}</span>
                <span className="tf__pr">₹{FALLBACK[0].price}</span>
                <span className="tf__sl">{FALLBACK[0].seller_alias} · {FALLBACK[0].seller_dept}</span>
              </div>
            </Link>
            <div className="ts">
              {FALLBACK.slice(1, 5).map((item, i) => (
                <Link key={item.id} href="/login" className="cd2" style={{ transitionDelay: `${0.15 + i * 0.08}s` }}
                  onMouseEnter={() => { setCurMode("product"); setCurText("VIEW"); curModeRef.current = "product"; }}
                  onMouseLeave={() => { setCurMode("default"); setCurText(""); curModeRef.current = "default"; }}>
                  <div className="cd2__img" style={{ background: GRAD[item.category] || GRAD.Tops }}>
                    <span className="cd2__e">{EMOJI[item.category] || "👗"}</span>
                    <span className="cd2__bd">VERIFIED</span>
                  </div>
                  <div className="cd2__inf">
                    <span className="cd2__nm">{item.title}</span>
                    <span className="cd2__pr">₹{item.price}</span>
                    <span className="cd2__sl">{item.seller_alias} · {item.seller_dept}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CAMPUS */}
        <section className="cp" ref={sCampus.ref}>
          <div className={`cp__in ${sCampus.visible ? "cp__in--v" : ""}`}>
            <span className="cp__lb">CAMPUS MARKETPLACE</span>
            <h2 className="cp__tt">THIS IS YOUR<br /><span className="cp__ac">CAMPUS CLOSET</span></h2>
            <p className="cp__ds">Verified students. Real fashion. Zero scams. Everything happens within your campus community.</p>
            <div className="cp__st">
              {([{ n: "KIIT", l: "Campus" }, { n: "100%", l: "Verified" }, { n: "₹0", l: "Scams" }] as const).map((s, i) => (
                <div key={i} className="cp__si" style={{ transitionDelay: `${0.3 + i * 0.12}s` }}>
                  <span className="cp__sn">{s.n}</span>
                  <span className="cp__sl">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cp__bg" />
        </section>

        {/* FRESH LISTINGS */}
        <section className="fr" ref={sFresh.ref}>
          <div className={`sh ${sFresh.visible ? "sh--in" : ""}`}>
            <span className="sn">02</span>
            <h2 className="st">FRESH LISTINGS</h2>
            <div className="sr" />
          </div>
          <div className="fr__pills">
            {CATEGORIES.map(c => (
              <button key={c.label} className={`pl ${category === c.label ? "pl--on" : ""}`} onClick={() => setCategory(c.label)}>
                {c.emoji && <span>{c.emoji}</span>}{c.label}
              </button>
            ))}
          </div>
          <div className={`fg ${sFresh.visible ? "fg--in" : ""}`}>
            {filtered.map((item, i) => (
              <Link key={item.id} href="/login" className="cd2" style={{ transitionDelay: `${0.05 + i * 0.06}s` }}
                onMouseEnter={() => { setCurMode("product"); setCurText("VIEW"); curModeRef.current = "product"; }}
                onMouseLeave={() => { setCurMode("default"); setCurText(""); curModeRef.current = "default"; }}>
                <div className="cd2__img" style={{ background: GRAD[item.category] || GRAD.Tops }}>
                  <span className="cd2__e">{EMOJI[item.category] || "👗"}</span>
                  <span className="cd2__bd">VERIFIED</span>
                  <button onClick={e => e.preventDefault()} className="cd2__ht">♡</button>
                </div>
                <div className="cd2__inf">
                  <span className="cd2__nm">{item.title}</span>
                  <span className="cd2__pr">₹{item.price}</span>
                  <span className="cd2__mt">{item.size} · {item.condition}</span>
                  <span className="cd2__sl">{item.seller_alias} · {item.seller_dept}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SELL CTA */}
        <section className="se" ref={sSell.ref}>
          <div className={`se__in ${sSell.visible ? "se__in--v" : ""}`}>
            <h2 className="se__tt">GOT SOMETHING<br />TO <span className="se__ac">SELL?</span></h2>
            <p className="se__ds">List in under 60 seconds. Reach your entire campus.</p>
            <Link href="/sell" className="cta cta--p cta--lg"
              onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
              onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
              START SELLING <span className="cta__a">→</span>
            </Link>
          </div>
          <div className="se__glow" />
        </section>

        {/* FOOTER */}
        <footer className="ft">
          <span className="ft__b">DRENZ</span>
          <div className="ft__l">
            <Link href="/explore">Explore</Link>
            <Link href="/sell">Sell</Link>
            <Link href="/profile">Profile</Link>
          </div>
          <div className="ft__c">
            <span>© 2024 DrenZ — Campus Fashion Marketplace</span>
            <span className="ft__s">KIIT · Student Verified · Zero Scams</span>
          </div>
        </footer>
      </main>

      <BottomNav />
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
@media(hover:hover){a,button,div{cursor:none!important}}
@media(hover:none){a,button{cursor:pointer}}

/* ── GRAIN ── */
.grain::before{
  content:'';position:fixed;inset:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity:.025;pointer-events:none;z-index:9000;mix-blend-mode:overlay;
}

/* ═══ CURSOR DOT ═══ */
.cd{
  position:fixed;
  left:-100px;top:-100px;
  width:16px;height:16px;
  border-radius:50%;
  background:#E5FF00;
  border:3px solid rgba(255,255,255,.92);
  pointer-events:none;
  z-index:2147483647;
  box-shadow:
    0 0 0 1px rgba(0,0,0,.3),
    0 0 4px 1px #E5FF00,
    0 0 14px 5px rgba(229,255,0,.65),
    0 0 36px 10px rgba(229,255,0,.28),
    0 0 70px 20px rgba(229,255,0,.08);
}

/* ═══ CURSOR HALO ═══ */
.ch{
  position:fixed;
  width:48px;height:48px;
  border-radius:50%;
  border:2px solid rgba(255,255,255,.24);
  background:rgba(229,255,0,.02);
  pointer-events:none;
  z-index:2147483646;
  will-change:transform;
  display:flex;align-items:center;justify-content:center;
  box-shadow:
    0 0 14px rgba(229,255,0,.06),
    inset 0 0 14px rgba(229,255,0,.03);
  transition:border-color .3s ease,background .3s ease,box-shadow .3s ease;
}
.ch--product{
  border-color:rgba(229,255,0,.38);
  background:rgba(229,255,0,.07);
  box-shadow:
    0 0 22px rgba(229,255,0,.14),
    inset 0 0 22px rgba(229,255,0,.06);
}
.ch--cta{
  background:#E5FF00;border-color:#E5FF00;
  box-shadow:0 0 28px rgba(229,255,0,.35),0 0 60px rgba(229,255,0,.08);
}
.cl{
  font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.18em;
  font-weight:500;color:var(--t);user-select:none;white-space:nowrap;
}
.cla{color:#000;font-size:16px}

/* ═══ ENTRANCE ═══ */
.en{position:fixed;inset:0;z-index:9999;pointer-events:none}
.en__h{
  position:absolute;left:0;right:0;height:50%;
  background:var(--bg);z-index:2;will-change:transform;
}
.en__h--t{top:0;transition:transform .7s cubic-bezier(.76,0,.24,1)}
.en__h--b{bottom:0;transition:transform .7s cubic-bezier(.76,0,.24,1)}
.en__h--out.en__h--t{transform:translateY(-104%)}
.en__h--out.en__h--b{transform:translateY(104%)}

.en__tw{
  position:absolute;left:0;right:0;bottom:0;height:100vh;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.en__tw--b{bottom:auto;top:0;margin-top:-50vh}

.en__w{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(3.5rem,14vw,10rem);
  letter-spacing:.32em;
  color:transparent;opacity:0;transform:scale(.82);
  transition:opacity .38s ease,transform .5s cubic-bezier(.34,1.56,.64,1);
}
.en__w--on{
  opacity:1;transform:scale(1);
  animation:csw .7s ease-in-out forwards;
}
@keyframes csw{
  0%{color:#0e0e0e;text-shadow:none}
  18%{color:#2a2a2a;text-shadow:0 0 20px rgba(42,42,42,.5)}
  40%{color:#555;text-shadow:0 0 35px rgba(85,85,85,.35)}
  60%{color:var(--ch);text-shadow:0 0 44px rgba(191,195,199,.28),0 0 90px rgba(229,255,0,.05)}
  80%{color:#eaeaea;text-shadow:0 0 30px rgba(229,255,0,.1)}
  100%{color:var(--t);text-shadow:0 0 18px rgba(229,255,0,.05)}
}

.en__dot{
  position:absolute;top:50%;left:50%;
  width:8px;height:8px;border-radius:50%;
  background:var(--y);z-index:5;
  opacity:0;transform:translate(-50%,-50%) scale(0);
  box-shadow:0 0 8px 2px var(--y),0 0 28px rgba(229,255,0,.6),0 0 64px rgba(229,255,0,.2);
  transition:opacity .14s ease,transform .2s cubic-bezier(.34,1.56,.64,1);
}
.en--dot .en__dot{opacity:1;transform:translate(-50%,-50%) scale(1)}
.en--streak .en__dot,.en--word .en__dot,.en--split .en__dot{
  opacity:0;transform:translate(-50%,-50%) scale(3.5);
  transition:opacity .1s ease .04s,transform .18s ease;
}

.en__streak{
  position:absolute;top:50%;left:50%;
  width:0;height:2px;background:var(--y);z-index:4;
  transform:translate(-50%,-50%);opacity:0;
  box-shadow:0 0 8px 2px var(--y),0 0 32px rgba(229,255,0,.45),0 0 80px rgba(229,255,0,.14);
  transition:width .36s cubic-bezier(.65,0,.35,1),opacity .2s ease;
}
.en--streak .en__streak{width:100vw;opacity:1}
.en--word .en__streak{width:100vw;opacity:0;transition:opacity .22s ease}

.en__flash{
  position:absolute;inset:0;z-index:3;opacity:0;
  background:radial-gradient(ellipse at center,rgba(229,255,0,.14) 0%,rgba(229,255,0,.04) 30%,transparent 62%);
  transition:opacity .18s ease;
}
.en--streak .en__flash{opacity:1}
.en--word .en__flash{opacity:0;transition:opacity .3s ease}

.en__seam{
  position:absolute;top:50%;left:0;right:0;height:1px;
  z-index:6;background:var(--y);opacity:0;transform:translateY(-.5px);
}
.en--split .en__seam{animation:sem .55s ease-out forwards}
@keyframes sem{
  0%{opacity:1;box-shadow:0 0 10px rgba(229,255,0,.5),0 0 30px rgba(229,255,0,.25)}
  45%{opacity:.6}
  100%{opacity:0}
}

/* ═══ IMPACT SHAKE ═══ */
@keyframes impact{
  0%{transform:translate(0,0) rotate(0)}
  8%{transform:translate(-6px,-4px) rotate(-.6deg)}
  16%{transform:translate(5px,3px) rotate(.5deg)}
  28%{transform:translate(-4px,4px) rotate(-.35deg)}
  40%{transform:translate(3px,-2px) rotate(.2deg)}
  56%{transform:translate(-2px,1px) rotate(-.1deg)}
  72%{transform:translate(1px,-1px)}
  88%{transform:translate(-1px,0)}
  100%{transform:translate(0,0) rotate(0)}
}
.hx--shake{animation:impact .6s cubic-bezier(.36,.07,.19,.97) both}

/* ═══ NAV ═══ */
.nv{
  position:fixed;top:0;left:0;right:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 40px;
  transition:all .4s cubic-bezier(.34,1.56,.64,1);
}
.nv--c{
  padding:14px 40px;
  background:rgba(8,8,8,.9);
  backdrop-filter:blur(20px) saturate(1.5);
  border-bottom:1px solid var(--b);
}
.nv__b{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.2em;transition:color .3s}
.nv__b:hover{color:var(--y)}
.nv__l{display:flex;gap:32px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--m)}
.nv__l a{transition:color .3s;position:relative}
.nv__l a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:1px;background:var(--y);transition:width .3s ease}
.nv__l a:hover{color:var(--t)}
.nv__l a:hover::after{width:100%}
.nv__cta{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:10px 24px;border:1px solid var(--b);border-radius:100px;transition:all .3s ease}
.nv__cta:hover{background:var(--y);color:#000;border-color:var(--y)}
@media(max-width:768px){.nv{padding:16px 20px}.nv--c{padding:12px 20px}.nv__l{display:none}}

/* ═══ HERO ═══ */
.hx{
  position:relative;min-height:100vh;
  display:flex;align-items:center;overflow:hidden;
  padding:120px 56px 80px;
}
@media(max-width:768px){.hx{flex-direction:column;align-items:flex-start;padding:110px 24px 40px;min-height:auto}}
.hx__glow{
  position:absolute;width:520px;height:520px;border-radius:50%;
  background:radial-gradient(circle,rgba(229,255,0,.04) 0%,transparent 65%);
  top:12%;right:12%;pointer-events:none;transition:transform .12s ease-out;
}
.hx__text{position:relative;z-index:2;max-width:640px;transition:transform .12s ease-out}
.hx__campus{opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
.hx__campus.v{opacity:1;transform:translateY(0);transition-delay:.08s}
.hx__badge{display:inline-block;font-size:10px;letter-spacing:.25em;padding:6px 18px;border:1px solid var(--b);border-radius:100px;color:var(--m);margin-bottom:28px}
.hx__title{font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,10vw,9rem);line-height:.88;letter-spacing:-.01em;margin-bottom:28px}
.hx__ln{display:block;opacity:0;transform:translateY(50px);transition:opacity .7s ease,transform .7s cubic-bezier(.34,1.56,.64,1)}
.hx__title.v .hx__ln:nth-child(1){opacity:1;transform:translateY(0);transition-delay:.18s}
.hx__title.v .hx__ln:nth-child(2){opacity:1;transform:translateY(0);transition-delay:.28s}
.hx__title.v .hx__ln:nth-child(3){opacity:1;transform:translateY(0);transition-delay:.38s}
.hx__ln--y{color:var(--y)}
.hx__ln--o{-webkit-text-stroke:2px var(--t);color:transparent}
.hx__tag{font-size:13px;letter-spacing:.35em;color:var(--m);margin-bottom:40px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}
.hx__tag.v{opacity:1;transform:translateY(0);transition-delay:.5s}
.hx__act{display:flex;gap:16px;opacity:0;transform:translateY(16px);transition:opacity .6s ease,transform .6s ease}
.hx__act.v{opacity:1;transform:translateY(0);transition-delay:.65s}
@media(max-width:768px){.hx__act{flex-direction:column}}

/* ═══ CTA ═══ */
.cta{
  display:inline-flex;align-items:center;gap:10px;
  font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.16em;
  text-transform:uppercase;font-weight:500;
  padding:16px 32px;border-radius:100px;
  position:relative;overflow:hidden;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);
}
.cta--p{background:var(--y);color:#000}
.cta--p::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);transform:translateX(-100%);transition:transform .5s ease}
.cta--p:hover::before{transform:translateX(100%)}
.cta--p:hover{transform:scale(1.06);box-shadow:0 0 32px rgba(229,255,0,.3),0 0 80px rgba(229,255,0,.08)}
.cta__a{transition:transform .3s ease;display:inline-block}
.cta--p:hover .cta__a{transform:translateX(5px)}
.cta--g{border:1px solid var(--b);color:var(--t)}
.cta--g:hover{border-color:var(--ch);background:rgba(191,195,199,.04)}
.cta--lg{padding:20px 48px;font-size:12px}

/* ═══ HERO PRODUCTS ═══ */
.hx__prods{position:absolute;inset:0;pointer-events:none;z-index:1;transition:transform .12s ease-out}
.hx__card{
  position:absolute;width:220px;
  background:var(--card);border:1px solid var(--b);
  border-radius:16px;overflow:hidden;
  pointer-events:auto;opacity:0;transform:translateY(50px);
  transition:opacity .7s ease,transform .7s cubic-bezier(.34,1.56,.64,1),box-shadow .4s ease,border-color .3s ease;
}
.hx__prods--in .hx__card{opacity:1;transform:translateY(0)}
.hx__prods--in .hx__card:nth-child(1){transition-delay:.45s}
.hx__prods--in .hx__card:nth-child(2){transition-delay:.57s}
.hx__prods--in .hx__card:nth-child(3){transition-delay:.69s}
.hx__prods--in .hx__card:nth-child(4){transition-delay:.81s}
.hx__card:nth-child(1){top:6%;right:4%}
.hx__card:nth-child(2){top:38%;right:28%}
.hx__card:nth-child(3){bottom:10%;right:6%}
.hx__card:nth-child(4){top:20%;left:55%}
.hx__card:hover{transform:translateY(-10px) scale(1.03)!important;box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 0 1px rgba(229,255,0,.1);border-color:rgba(229,255,0,.14)}
.hx__card-img{height:210px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.hx__card-img::after{content:'';position:absolute;top:0;left:-120%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(191,195,199,.08),transparent);transition:left .6s ease}
.hx__card:hover .hx__card-img::after{left:180%}
.hx__card-e{font-size:3.5rem}
.hx__card-m{padding:14px 16px;display:flex;flex-direction:column;gap:4px}
.hx__card-n{font-size:12px;font-weight:500;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hx__card-p{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:var(--y)}
@media(max-width:768px){
  .hx__prods{position:relative;display:flex;overflow-x:auto;gap:14px;padding:32px 0 16px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
  .hx__prods::-webkit-scrollbar{display:none}
  .hx__card{position:relative!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;flex-shrink:0;width:180px;opacity:1;transform:none!important}
  .hx__card-img{height:180px}
}

/* ═══ CHROME CIRCLES ═══ */
.cc{position:absolute;border:1px solid rgba(191,195,199,.06);border-radius:50%;pointer-events:none;transition:transform .12s ease-out}
.cc--1{width:320px;height:320px;top:8%;right:25%}
.cc--2{width:180px;height:180px;bottom:18%;left:35%}
@media(max-width:768px){.cc{display:none}}

/* ═══ KINETIC ═══ */
.ki{padding:64px 0;overflow:hidden;border-top:1px solid var(--b);border-bottom:1px solid var(--b);background:var(--bg2)}
.ki__t{display:flex;white-space:nowrap;will-change:transform}
.ki__tx{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,9vw,7rem);letter-spacing:.04em;color:var(--t);opacity:.1;padding:0 8px;flex-shrink:0}

/* ═══ SECTION HEAD ═══ */
.sh{display:flex;align-items:center;gap:20px;margin-bottom:48px;padding:0 56px;opacity:0;transform:translateY(20px);transition:opacity .6s ease,transform .6s ease}
.sh--in{opacity:1;transform:translateY(0)}
.sn{font-size:11px;letter-spacing:.2em;color:var(--cd)}
.st{font-family:'Bebas Neue',sans-serif;font-size:clamp(1.5rem,4vw,2.5rem);letter-spacing:.1em}
.sr{flex:1;height:1px;background:var(--b)}
@media(max-width:768px){.sh{padding:0 24px}}

/* ═══ TRENDING ═══ */
.tr{padding:100px 0 80px}
.tg{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;padding:0 56px;max-width:1400px;margin:0 auto}
@media(max-width:768px){.tg{grid-template-columns:1fr;padding:0 24px}}
.tf{display:block;background:var(--card);border:1px solid var(--b);border-radius:20px;overflow:hidden;opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s cubic-bezier(.34,1.56,.64,1),box-shadow .4s ease,border-color .3s ease}
.tg--in .tf{opacity:1;transform:translateY(0)}
.tf:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,.5);border-color:rgba(229,255,0,.1)}
.tf__img{height:340px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.tf__img::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,var(--card) 100%);z-index:1}
.tf__img::after{content:'';position:absolute;top:0;left:-120%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(191,195,199,.07),transparent);transition:left .6s ease}
.tf:hover .tf__img::after{left:180%}
.tf__e{font-size:5rem;position:relative;z-index:0}
.tf__inf{padding:20px 24px 24px;display:flex;flex-direction:column;gap:6px}
.tf__badge{font-size:9px;letter-spacing:.2em;color:var(--y);font-weight:600}
.tf__nm{font-size:16px;font-weight:600}
.tf__pr{font-family:'Bebas Neue',sans-serif;font-size:2rem;color:var(--y);letter-spacing:.04em}
.tf__sl{font-size:11px;color:var(--m)}
.ts{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;align-content:start}

/* ═══ CARD ═══ */
.cd2{display:block;background:var(--card);border:1px solid var(--b);border-radius:16px;overflow:hidden;opacity:0;transform:translateY(30px);transition:opacity .6s ease,transform .6s cubic-bezier(.34,1.56,.64,1),box-shadow .4s ease,border-color .3s ease}
.tg--in .cd2,.fg--in .cd2{opacity:1;transform:translateY(0)}
.cd2:hover{transform:translateY(-6px) scale(1.02)!important;box-shadow:0 18px 44px rgba(0,0,0,.5);border-color:rgba(229,255,0,.12)}
.cd2__img{height:200px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.cd2__img::after{content:'';position:absolute;top:0;left:-120%;width:50%;height:100%;background:linear-gradient(90deg,transparent,rgba(191,195,199,.07),transparent);transition:left .5s ease}
.cd2:hover .cd2__img::after{left:180%}
.cd2__e{font-size:3rem;transition:transform .4s cubic-bezier(.34,1.56,.64,1)}
.cd2:hover .cd2__e{transform:scale(1.12)}
.cd2__bd{position:absolute;top:10px;left:10px;font-size:8px;letter-spacing:.2em;font-weight:700;padding:3px 10px;border-radius:100px;background:rgba(0,0,0,.55);backdrop-filter:blur(6px)}
.cd2__ht{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.4);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-size:14px;transition:all .25s ease}
.cd2__ht:hover{background:var(--y);color:#000;transform:scale(1.15)}
.cd2__inf{padding:14px 16px;display:flex;flex-direction:column;gap:3px}
.cd2__nm{font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cd2__pr{font-family:'Bebas Neue',sans-serif;font-size:1.25rem;color:var(--y)}
.cd2__mt{font-size:10px;color:var(--m)}
.cd2__sl{font-size:10px;color:var(--cd)}
@media(max-width:768px){.cd2__img{height:160px}}

/* ═══ CAMPUS ═══ */
.cp{padding:120px 56px;background:var(--bg2);border-top:1px solid var(--b);border-bottom:1px solid var(--b);position:relative;overflow:hidden}
@media(max-width:768px){.cp{padding:80px 24px}}
.cp__in{max-width:680px;position:relative;z-index:1}
.cp__in--v .cp__lb,.cp__in--v .cp__tt,.cp__in--v .cp__ds,.cp__in--v .cp__st{opacity:1;transform:translateY(0)}
.cp__lb{display:block;font-size:10px;letter-spacing:.3em;color:var(--y);margin-bottom:20px;opacity:0;transform:translateY(16px);transition:opacity .6s ease .1s,transform .6s ease .1s}
.cp__tt{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,7vw,5rem);line-height:.95;margin-bottom:20px;opacity:0;transform:translateY(20px);transition:opacity .7s ease .2s,transform .7s ease .2s}
.cp__ac{color:var(--y)}
.cp__ds{font-size:13px;line-height:1.8;color:var(--m);max-width:460px;margin-bottom:44px;opacity:0;transform:translateY(16px);transition:opacity .6s ease .35s,transform .6s ease .35s}
.cp__st{display:flex;gap:48px;opacity:0;transform:translateY(16px);transition:opacity .6s ease .5s,transform .6s ease .5s}
.cp__si{display:flex;flex-direction:column;gap:4px}
.cp__sn{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.04em}
.cp__sl{font-size:10px;letter-spacing:.18em;color:var(--m);text-transform:uppercase}
.cp__bg{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(229,255,0,.03) 0%,transparent 65%);top:50%;right:-10%;transform:translateY(-50%);pointer-events:none}

/* ═══ FRESH LISTINGS ═══ */
.fr{padding:100px 0 80px}
.fr__pills{display:flex;gap:10px;overflow-x:auto;padding:0 56px 32px;scrollbar-width:none}
.fr__pills::-webkit-scrollbar{display:none}
@media(max-width:768px){.fr__pills{padding:0 24px 24px}}
.pl{padding:10px 20px;border-radius:100px;font-size:11px;letter-spacing:.1em;white-space:nowrap;display:flex;align-items:center;gap:6px;border:1px solid var(--b);color:var(--m);transition:all .3s ease}
.pl:hover{border-color:var(--ch);color:var(--t)}
.pl--on{background:var(--y);color:#000;border-color:var(--y);font-weight:600}
.pl--on:hover{color:#000}
.fg{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:0 56px;max-width:1400px;margin:0 auto}
@media(max-width:1024px){.fg{grid-template-columns:repeat(2,1fr);gap:12px;padding:0 24px}}

grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){.fg{/* ═══ SELL CTA ═══ */
.se{padding:120px 56px;text-align:center;position:relative;overflow:hidden}
@media(max-width:768px){.se{padding:80px 24px}}
.se__in{position:relative;z-index:1;opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease}
.se__in--v{opacity:1;transform:translateY(0)}
.se__tt{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,8vw,6rem);line-height:.95;margin-bottom:16px}
.se__ac{color:var(--y)}
.se__ds{font-size:13px;color:var(--m);margin-bottom:36px}
.se__glow{position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(229,255,0,.04) 0%,transparent 65%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}

/* ═══ FOOTER ═══ */
.ft{padding:56px 56px 36px;border-top:1px solid var(--b);text-align:center}
@media(max-width:768px){.ft{padding:40px 24px 28px}}
.ft__b{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:.3em;display:block;margin-bottom:20px}
.ft__l{display:flex;justify-content:center;gap:32px;margin-bottom:28px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--m)}
.ft__l a{transition:color .3s}
.ft__l a:hover{color:var(--y)}
.ft__c{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--cd)}
.ft__s{font-size:9px;letter-spacing:.18em;color:var(--b);text-transform:uppercase}

/* ═══ REDUCED MOTION ═══ */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
  .en{display:none!important}
  .ch,.cd{display:none!important}
  .hx__campus,.hx__ln,.hx__tag,.hx__act,.hx__card,.tf,.cd2,.sh,.cp__in,.se__in{opacity:1!important;transform:none!important}
  .hx__prods--in .hx__card{opacity:1;transform:none}
  .tg--in .tf,.tg--in .cd2,.fg--in .cd2{opacity:1;transform:none}
}
`;