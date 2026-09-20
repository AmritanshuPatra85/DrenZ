"use client";

import { useState, useEffect, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";

export default function LoginPage() {
  /* ── Auth state (UNCHANGED) ── */
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  /* ── UI state ── */
  const [phase, setPhase] = useState<"init" | "sweep" | "word" | "reveal" | "done">("init");
  const [mouse, setMouse] = useState({ x: -200, y: -200 });
  const [curMode, setCurMode] = useState<"default" | "cta" | "back">("default");
  const [hasHover, setHasHover] = useState(true);
  const [reduced, setReduced] = useState(false);

  /* ── Refs ── */
  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const curModeRef = useRef<"default" | "cta" | "back">("default");
  const haloPos = useRef({ x: -200, y: -200 });
  const rafId = useRef(0);
  const authRef = useRef<HTMLDivElement>(null);
  const authCenter = useRef({ x: 0, y: 0 });

  /* ── Detect hover + reduced-motion ── */
  useEffect(() => {
    const hq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasHover(hq.matches);
    const hFn = (e: MediaQueryListEvent) => setHasHover(e.matches);
    hq.addEventListener("change", hFn);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const rFn = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", rFn);

    return () => {
      hq.removeEventListener("change", hFn);
      mq.removeEventListener("change", rFn);
    };
  }, []);

  /* ── Entrance sequence ── */
  useEffect(() => {
    if (reduced) { setPhase("done"); return; }
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setPhase("sweep"), 60));
    t.push(setTimeout(() => setPhase("word"), 200));
    t.push(setTimeout(() => setPhase("reveal"), 380));
    t.push(setTimeout(() => setPhase("done"), 860));
    return () => t.forEach(clearTimeout);
  }, [reduced]);

  /* ── Cache auth card center after reveal ── */
  useEffect(() => {
    if (phase === "done" && authRef.current) {
      const r = authRef.current.getBoundingClientRect();
      authCenter.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
  }, [phase]);

  /* ── Sync curMode to ref ── */
  useEffect(() => { curModeRef.current = curMode; }, [curMode]);

  /* ── Mouse tracking ── */
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

  /* ── Cursor rAF loop ── */
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
        const s = m === "cta" ? 1.36 : m === "back" ? 1.2 : 1;
        haloRef.current.style.transform =
          `translate(${haloPos.current.x - 24}px,${haloPos.current.y - 24}px) scale(${s})`;
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, [hasHover, reduced]);

  /* ── Derived ── */
  const showCursor = hasHover && !reduced;
  const revealDone = phase === "reveal" || phase === "done";
  const w = typeof window !== "undefined" ? window.innerWidth : 1440;
  const h = typeof window !== "undefined" ? window.innerHeight : 900;
  const px = (mouse.x - w / 2) / 90;
  const py = (mouse.y - h / 2) / 90;

  /* ── Auth tilt ── */
  let tiltX = 0;
  let tiltY = 0;
  if (revealDone && hasHover && authCenter.current.x) {
    const dx = (mouse.x - authCenter.current.x) / 300;
    const dy = (mouse.y - authCenter.current.y) / 300;
    tiltX = Math.max(-1, Math.min(1, dy * -0.7));
    tiltY = Math.max(-1, Math.min(1, dx * 0.7));
  }

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <>
      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Cursor */}
      {showCursor && (
        <>
          <div ref={dotRef} className="cd" />
          <div ref={haloRef} className={`ch ch--${curMode}`}>
            {curMode === "cta" && <span className="cl">→</span>}
            {curMode === "back" && <span className="cl">BACK</span>}
          </div>
        </>
      )}

      {/* Entrance sweep */}
      <div className={`sw ${phase === "sweep" ? "sw--on" : ""} ${(phase === "word" || phase === "reveal" || phase === "done") ? "sw--off" : ""}`} />

      {/* Main */}
      <main className="lg grain">

        {/* Back link */}
        <Link href="/" className="lg__back"
          onMouseEnter={() => { setCurMode("back"); curModeRef.current = "back"; }}
          onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}>
          ← BACK
        </Link>

        {/* ── LEFT: Editorial ── */}
        <div className="lg__left">
          <div className="lg__brand">
            <span className={`lg__brand-t ${phase === "word" || revealDone ? "lg__brand-t--on" : ""}`}>DRENZ</span>
          </div>

          <h1 className={`lg__hd ${revealDone ? "lg__hd--on" : ""}`}>
            <span className="lg__ln">ENTER</span>
            <span className="lg__ln">THE</span>
            <span className="lg__ln lg__ln--y">CAMPUS</span>
            <span className="lg__ln lg__ln--o">CLOSET.</span>
          </h1>

          <p className={`lg__sub ${revealDone ? "lg__sub--on" : ""}`}>
            Your campus.<br />
            Your fashion.<br />
            Your marketplace.
          </p>

          {/* Fashion objects */}
          <div className={`lg__fo ${revealDone ? "lg__fo--on" : ""}`}
            style={hasHover && revealDone ? { transform: `translate(${px * 2}px,${py * 2}px)` } : undefined}>
            <div className="fo fo--1">
              <div className="fo__inner" />
              <span className="fo__txt fo__txt--lg">25</span>
              <span className="fo__txt fo__txt--sm">SS</span>
              <div className="fo__accent" />
            </div>
            <div className="fo fo--2">
              <div className="fo__inner" />
              <span className="fo__txt fo__txt--sm fo__txt--campus">KIIT</span>
              <div className="fo__grid" />
            </div>
          </div>
        </div>

        {/* ── RIGHT: Auth ── */}
        <div className="lg__right">
          <div className={`auth-wrap ${revealDone ? "auth-wrap--on" : ""}`}>
            <div
              ref={authRef}
              className="auth"
              style={hasHover && revealDone
                ? { transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` }
                : undefined}
            >
              <span className="auth__welcome">WELCOME TO</span>
              <h2 className="auth__title">DRENZ.</h2>
              <p className="auth__desc">Your KIIT account gets you in.</p>

              {/* Google button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="auth__g"
                onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
                onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48" className="auth__g-icon" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="auth__g-label">
                  {loading ? "Connecting" : "Continue with Google"}
                </span>
                {!loading && <span className="auth__g-arr">→</span>}
                {loading && (
                  <span className="auth__dots">
                    <span className="auth__dot">·</span>
                    <span className="auth__dot">·</span>
                    <span className="auth__dot">·</span>
                  </span>
                )}
              </button>

              {/* Error */}
              {error && (
                <div className="auth__err">
                  <span className="auth__err-l">SIGN IN FAILED</span>
                  <p className="auth__err-m">{error}</p>
                </div>
              )}

              {/* KIIT Verification */}
              <div className="auth__ver">
                <span className="auth__ver-chk">✓</span>
                <div className="auth__ver-body">
                  <span className="auth__ver-t">KIIT STUDENTS ONLY</span>
                  <p className="auth__ver-d">
                    @kiit.ac.in accounts accepted. Personal Gmail accounts are rejected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms */}
        <p className={`lg__terms ${revealDone ? "lg__terms--on" : ""}`}>
          By continuing you agree to our Terms. No outsiders. No personal Gmail.
        </p>
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
@media(hover:hover){a,button,div{cursor:none!important}}
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
.ch--product{border-color:rgba(229,255,0,.38);background:rgba(229,255,0,.07)}
.ch--cta{background:#E5FF00;border-color:#E5FF00;box-shadow:0 0 28px rgba(229,255,0,.35),0 0 60px rgba(229,255,0,.08)}
.ch--back{border-color:rgba(255,255,255,.35)}
.cl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;font-weight:500;color:var(--t);user-select:none;white-space:nowrap}
.ch--cta .cl{color:#000;font-size:14px}

/* ═══ SWEEP ═══ */
.sw{
  position:fixed;top:50%;left:50%;
  width:0;height:2px;
  transform:translate(-50%,-50%);
  background:var(--y);z-index:9998;pointer-events:none;opacity:0;
  box-shadow:0 0 6px 2px var(--y),0 0 28px rgba(229,255,0,.45),0 0 60px rgba(229,255,0,.12);
  transition:width .32s cubic-bezier(.65,0,.35,1),opacity .1s ease;
}
.sw--on{width:100vw;opacity:1}
.sw--off{opacity:0;transition:opacity .22s ease}

/* ═══ LOGIN LAYOUT ═══ */
.lg{
  position:relative;
  min-height:100vh;
  display:flex;
  background:var(--bg);
  overflow:hidden;
}
.lg::after{
  content:'';position:absolute;
  width:600px;height:600px;border-radius:50%;
  background:radial-gradient(circle,rgba(229,255,0,.025) 0%,transparent 60%);
  top:-15%;right:10%;pointer-events:none;
}

/* ── Back button ── */
.lg__back{
  position:fixed;top:24px;left:32px;z-index:100;
  font-size:10px;letter-spacing:.16em;
  color:var(--m);text-transform:uppercase;
  padding:8px 16px;
  transition:color .3s;
}
.lg__back:hover{color:var(--y)}

/* ── Left panel ── */
.lg__left{
  flex:1;display:flex;flex-direction:column;
  justify-content:center;
  padding:120px 64px 80px;
  position:relative;
}

/* ── Brand wordmark ── */
.lg__brand{margin-bottom:36px}
.lg__brand-t{
  font-family:'Bebas Neue',sans-serif;
  font-size:1.3rem;letter-spacing:.25em;
  color:transparent;opacity:0;
  transition:opacity .35s ease;
}
.lg__brand-t--on{
  opacity:1;animation:csw .65s ease-in-out forwards;
}
@keyframes csw{
  0%{color:#0e0e0e;text-shadow:none}
  20%{color:#2a2a2a}
  45%{color:#555}
  65%{color:var(--ch);text-shadow:0 0 28px rgba(191,195,199,.2)}
  85%{color:#e0e0e0}
  100%{color:var(--t);text-shadow:none}
}

/* ── Heading ── */
.lg__hd{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(3.5rem,8vw,7.5rem);
  line-height:.88;letter-spacing:-.01em;
  margin-bottom:32px;
}
.lg__ln{
  display:block;
  opacity:0;transform:translateY(40px);
  transition:opacity .65s ease,transform .65s cubic-bezier(.34,1.56,.64,1);
}
.lg__hd--on .lg__ln:nth-child(1){opacity:1;transform:translateY(0);transition-delay:.08s}
.lg__hd--on .lg__ln:nth-child(2){opacity:1;transform:translateY(0);transition-delay:.16s}
.lg__hd--on .lg__ln:nth-child(3){opacity:1;transform:translateY(0);transition-delay:.24s}
.lg__hd--on .lg__ln:nth-child(4){opacity:1;transform:translateY(0);transition-delay:.32s}
.lg__ln--y{color:var(--y)}
.lg__ln--o{-webkit-text-stroke:2px var(--t);color:transparent}

/* ── Subtitle ── */
.lg__sub{
  font-size:13px;line-height:2;letter-spacing:.08em;color:var(--m);
  opacity:0;transform:translateY(16px);
  transition:opacity .6s ease,transform .6s ease;
}
.lg__sub--on{opacity:1;transform:translateY(0);transition-delay:.42s}

/* ═══ FASHION OBJECTS ═══ */
.lg__fo{
  position:absolute;bottom:80px;right:40px;
  width:260px;height:340px;
  pointer-events:none;
  opacity:0;transform:translateY(30px);
  transition:opacity .7s ease .35s,transform .12s ease-out;
}
.lg__fo--on{opacity:1;transform:translateY(0)}

.fo{position:absolute;border:1px solid var(--b);overflow:hidden}
.fo--1{
  width:180px;height:260px;
  bottom:0;right:60px;
  border-radius:14px;
  transform:rotate(-4deg);
  animation:fo1 6s ease-in-out infinite;
}
.fo--2{
  width:120px;height:160px;
  bottom:40px;right:0;
  border-radius:12px;
  transform:rotate(2.5deg);
  animation:fo2 7s ease-in-out infinite 1s;
}
@keyframes fo1{
  0%,100%{transform:rotate(-4deg) translateY(0)}
  50%{transform:rotate(-3.5deg) translateY(-10px)}
}
@keyframes fo2{
  0%,100%{transform:rotate(2.5deg) translateY(0)}
  50%{transform:rotate(3deg) translateY(-7px)}
}

.fo__inner{
  position:absolute;inset:0;
  background:linear-gradient(160deg,#131316,#1a1a22,#151518);
}
.fo--2 .fo__inner{background:linear-gradient(145deg,#141412,#1e1a16,#161514)}

.fo__txt{
  position:relative;z-index:1;
  font-family:'Bebas Neue',sans-serif;
  display:block;
}
.fo__txt--lg{
  font-size:6rem;color:rgba(255,255,255,.06);
  position:absolute;bottom:16px;right:12px;
  line-height:1;letter-spacing:-.02em;
}
.fo__txt--sm{
  font-size:11px;letter-spacing:.3em;
  color:var(--cd);position:absolute;
  bottom:16px;left:16px;
}
.fo__txt--campus{
  bottom:auto;top:50%;left:50%;
  transform:translate(-50%,-50%);
  font-size:13px;color:var(--cd);
}

.fo__accent{
  position:absolute;top:0;left:0;right:0;
  height:1px;
  background:linear-gradient(90deg,transparent,var(--b),transparent);
}
.fo__grid{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px);
  background-size:24px 24px;
}

/* ═══ AUTH PANEL ═══ */
.lg__right{
  flex:1;display:flex;align-items:center;justify-content:center;
  padding:120px 64px 80px;
}

.auth-wrap{
  width:100%;max-width:380px;
  opacity:0;transform:translateX(30px);
  transition:opacity .6s ease .1s,transform .6s cubic-bezier(.34,1.56,.64,1) .1s;
}
.auth-wrap--on{opacity:1;transform:translateX(0)}

.auth{
  position:relative;
  background:var(--bg2);
  border:1px solid var(--b);
  border-radius:20px;
  padding:40px 36px;
  transition:transform .15s ease-out,box-shadow .4s ease,border-color .3s ease;
}
.auth:hover{
  border-color:rgba(191,195,199,.12);
  box-shadow:0 0 60px rgba(191,195,199,.03);
}

.auth__welcome{
  display:block;font-size:10px;letter-spacing:.3em;
  color:var(--cd);margin-bottom:6px;
}
.auth__title{
  font-family:'Bebas Neue',sans-serif;
  font-size:2.8rem;letter-spacing:.08em;
  margin-bottom:8px;
}
.auth__desc{
  font-size:12px;color:var(--m);line-height:1.6;
  margin-bottom:32px;
}

/* ── Google Button ── */
.auth__g{
  width:100%;
  display:flex;align-items:center;gap:12px;
  background:#fff;color:#000;
  font-family:'DM Mono',monospace;
  font-size:12px;font-weight:500;
  letter-spacing:.04em;
  padding:16px 20px;
  border-radius:14px;
  position:relative;overflow:hidden;
  transition:transform .3s cubic-bezier(.34,1.56,.64,1),
             box-shadow .3s ease;
}
.auth__g:hover:not(:disabled){
  transform:translateY(-2px);
  box-shadow:0 8px 30px rgba(255,255,255,.08),0 0 0 1px rgba(255,255,255,.1);
}
.auth__g:active:not(:disabled){transform:translateY(0)}
.auth__g:disabled{opacity:.55;cursor:not-allowed}

.auth__g-icon{flex-shrink:0}
.auth__g-label{flex:1;text-align:left}
.auth__g-arr{
  font-size:15px;
  transition:transform .3s ease;
}
.auth__g:hover:not(:disabled) .auth__g-arr{transform:translateX(4px)}

/* ── Loading dots ── */
.auth__dots{
  display:inline-flex;gap:2px;
  margin-left:2px;
}
.auth__dot{
  font-size:18px;line-height:1;
  animation:dotPulse 1.2s infinite;
  opacity:.2;
}
.auth__dot:nth-child(1){animation-delay:0s}
.auth__dot:nth-child(2){animation-delay:.2s}
.auth__dot:nth-child(3){animation-delay:.4s}
@keyframes dotPulse{
  0%,60%,100%{opacity:.15}
  30%{opacity:1}
}

/* ── Error ── */
.auth__err{
  margin-top:20px;
  padding:16px 18px;
  background:rgba(255,255,255,.02);
  border:1px solid rgba(220,60,60,.18);
  border-radius:12px;
}
.auth__err-l{
  display:block;font-size:10px;letter-spacing:.18em;
  color:rgba(255,100,100,.8);font-weight:600;
  margin-bottom:6px;
}
.auth__err-m{
  font-size:11px;line-height:1.6;
  color:rgba(255,140,140,.6);
}

/* ── Verification ── */
.auth__ver{
  margin-top:24px;
  padding:16px 18px;
  background:rgba(255,255,255,.015);
  border:1px solid var(--b);
  border-radius:12px;
  display:flex;gap:14px;align-items:flex-start;
}
.auth__ver-chk{
  font-size:14px;color:var(--y);
  flex-shrink:0;margin-top:1px;
}
.auth__ver-t{
  display:block;font-size:10px;letter-spacing:.18em;
  color:var(--t);font-weight:600;margin-bottom:4px;
}
.auth__ver-d{
  font-size:11px;line-height:1.6;color:var(--cd);
}

/* ═══ TERMS ═══ */
.lg__terms{
  position:absolute;
  bottom:24px;left:0;right:0;
  text-align:center;
  font-size:10px;letter-spacing:.06em;
  color:rgba(255,255,255,.18);
  opacity:0;
  transition:opacity .6s ease;
}
.lg__terms--on{opacity:1;transition-delay:.6s}

/* ═══ RESPONSIVE ═══ */
@media(max-width:1024px){
  .lg__left{padding:100px 40px 60px}
  .lg__right{padding:100px 40px 60px}
  .lg__fo{display:none}
}
@media(max-width:768px){
  .lg{
    flex-direction:column;
    min-height:100vh;
  }
  .lg__left{
    padding:100px 24px 0;
    align-items:center;
    text-align:center;
  }
  .lg__brand{margin-bottom:20px}
  .lg__hd{
    font-size:clamp(2.8rem,12vw,4.5rem);
    margin-bottom:16px;
  }
  .lg__sub{font-size:12px;margin-bottom:8px}
  .lg__fo{
    position:relative;bottom:auto;right:auto;
    width:200px;height:240px;
    margin:24px auto 0;
  }
  .fo--1{width:140px;height:200px;right:40px}
  .fo--2{width:90px;height:120px;right:0;bottom:20px}
  .lg__right{
    padding:28px 24px 0;
    flex:0;
  }
  .auth{padding:28px 24px}
  .auth__title{font-size:2rem}
  .lg__terms{
    position:relative;bottom:auto;
    padding:24px 24px 32px;
  }
  .lg__back{top:16px;left:16px}
}

/* ═══ REDUCED MOTION ═══ */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    transition-duration:.01ms!important;
  }
  .sw{display:none!important}
  .cd,.ch{display:none!important}
  .lg__brand-t,.lg__ln,.lg__sub,.lg__fo,.auth-wrap,.lg__terms{
    opacity:1!important;transform:none!important;
  }
}
`;