"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { generateAliases } from "@/lib/alias-generator";

const MAX_REGENERATE_USES = 5;

export default function AliasPickerPage() {
  /* ── State (UNCHANGED) ── */
  const [aliases, setAliases] = useState<string[]>(() => generateAliases());
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [regenerateUses, setRegenerateUses] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aliasKey, setAliasKey] = useState(0);

  const regenerateDisabled = useMemo(
    () => regenerateUses >= MAX_REGENERATE_USES || isSaving,
    [regenerateUses, isSaving]
  );

  /* ── Handlers (UNCHANGED LOGIC) ── */
  const handleRegenerate = () => {
    if (regenerateUses >= MAX_REGENERATE_USES) return;
    setAliases(generateAliases());
    setSelectedAlias(null);
    setRegenerateUses((previous) => previous + 1);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAliasKey((k) => k + 1);
  };

  const handleConfirm = async () => {
    if (!selectedAlias) return;
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: selectedAlias }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const fallback = "We could not save your alias. Please try again.";
        setErrorMessage(typeof payload.error === "string" ? payload.error : fallback);
        return;
      }
      setSuccessMessage(`Alias locked in: ${selectedAlias}`);
      window.location.href = "/home";
    } catch {
      setErrorMessage("Network issue detected. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ═══ NEW UI STATE ═══ */
  const [hasHover, setHasHover] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [entered, setEntered] = useState(false);
  const [mouse, setMouse] = useState({ x: -200, y: -200 });
  const [curMode, setCurMode] = useState<"default" | "select" | "cta">("default");

  const dotRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -200, y: -200 });
  const curModeRef = useRef<"default" | "select" | "cta">("default");
  const haloPos = useRef({ x: -200, y: -200 });
  const rafId = useRef(0);

  /* ── Hover + reduced-motion ── */
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

  /* ── Entrance ── */
  useEffect(() => {
    if (reduced) { setEntered(true); return; }
    const t = setTimeout(() => setEntered(true), 60);
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
        const s = m === "select" ? 1.4 : m === "cta" ? 1.36 : 1;
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
            {curMode === "select" && <span className="cl">PICK</span>}
            {curMode === "cta" && <span className="cl cla">→</span>}
          </div>
        </>
      )}

      <main className="ap grain">

        {/* ── TOP BAR ── */}
        <header className={`ap__bar ${entered ? "ap__bar--on" : ""}`}>
          <span className="ap__brand">DRENZ</span>
          <span className="ap__progress">
            <span className="ap__progress-label">CAMPUS IDENTITY</span>
            <span className="ap__progress-n">01 / 01</span>
          </span>
        </header>

        {/* ── LAYOUT ── */}
        <div className="ap__wrap">

          {/* ── LEFT: EDITORIAL ── */}
          <div className={`ap__left ${entered ? "ap__left--on" : ""}`}>
            <h1 className="ap__hd">
              <span className="ap__ln">CHOOSE</span>
              <span className="ap__ln">YOUR</span>
              <span className="ap__ln ap__ln--y">ALIAS.</span>
            </h1>
            <p className="ap__sub">This is how you&apos;ll appear on the campus marketplace.</p>
            <div className="ap__meta">
              <span className="ap__meta-brand">DRENZ</span>
              <span className="ap__meta-line" />
              <span className="ap__meta-info>
          </div>

          {/* ── RIGHT: SELECTION PANEL ── */}
          <div className={`ap__right ${entered ? "ap__right--on" : ""}`}>

            {/* Alias list */}
            <div className="ap__list" key={aliasKey}>
              {aliases.map((alias, i) => {
                const selected = alias === selectedAlias;
                return (
                  <button
                    key={alias}
                    type="button"
                    onClick={() => {
                      setSelectedAlias(alias);
                      setErrorMessage(null);
                    }}
                    className={`ap__opt ${selected ? "ap__opt--on" : ""}`}
                    style={{ animationDelay: `${0.08 + i * 0.06}s` }}
                    onMouse">CAMPUS IDENTITY / 01</span>
            </divEnter={() => { setCurMode("select"); curModeRef.current = "select"; }}
                    onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}
                  >
                    <span className="ap__opt-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="ap__opt-name">{alias}</span>
                    <span className={`ap__opt-radio ${selected ? "ap__opt-radio--on" : ""}`}>
                      {selected && <span className="ap__opt-radio-dot" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Regenerate */}
            <div className="ap__regen">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerateDisabled}
                className={`ap__regen-btn ${regenerateDisabled ? "ap__regen-btn--off" : ""}`}
                onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
                onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}
              >
                <span className="ap__regen-ic">↻</span>
                <span className="ap__regen-label">REGENERATE</span>
              </button>
              <span className="ap__regen-count">
                {String(regenerateUses).padStart(2, "0")} / {String(MAX_REGENERATE_USES).padStart(2, "0")}
              </span>
            </div>

            {/* Selected confirmation */}
            {selectedAlias && (
              <div className="ap__confirm">
                <p className="ap__perm">
                  <span className="ap__perm-head">YOUR IDENTITY</span>
                  <br />
                  becomes permanent after 7 days.
                </p>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="ap__cta"
                  onMouseEnter={() => { setCurMode("cta"); curModeRef.current = "cta"; }}
                  onMouseLeave={() => { setCurMode("default"); curModeRef.current = "default"; }}
                >
                  {isSaving ? (
                    <span className="ap__cta-saving">
                      LOCKING IN
                      <span className="ap__cta-dots">
                        <span className="ap__cta-dot">·</span>
                        <span className="ap__cta-dot">·</span>
                        <span className="ap__cta-dot">·</span>
                      </span>
                    </span>
                  ) : (
                    <>
                      LOCK IT IN <span className="ap__cta-arr">→</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error */}
            {errorMessage && (
              <div className="ap__msg ap__msg--err">
                <span className="ap__msg-dot ap__msg-dot--err" />
                <span className="ap__msg-text">{errorMessage}</span>
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="ap__msg ap__msg--ok">
                <span className="ap__msg-dot ap__msg-dot--ok" />
                <span className="ap__msg-text">{successMessage}</span>
              </div>
            )}
          </div>
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
button{background:none;border:none;color:inherit;font:inherit;font-family:inherit}
@media(hover:hover){a,button,div,input{cursor:none!important}}
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
.ch--select{
  border-color:rgba(229,255,0,.32);
  background:rgba(229,255,0,.05);
}
.ch--cta{
  background:#E5FF00;border-color:#E5FF00;
  box-shadow:0 0 28px rgba(229,255,0,.35),0 0 60px rgba(229,255,0,.08);
}
.cl{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.16em;font-weight:500;color:var(--t);user-select:none;white-space:nowrap}
.cla{color:#000;font-size:14px}

/* ═══ PAGE ═══ */
.ap{
  min-height:100vh;display:flex;flex-direction:column;
  background:var(--bg);overflow:hidden;
}

/* ── Top bar ── */
.ap__bar{
  display:flex;align-items:center;justify-content:space-between;
  padding:24px 32px;
  opacity:0;transform:translateY(-8px);
  transition:opacity .5s ease,transform .5s ease;
}
.ap__bar--on{opacity:1;transform:translateY(0);transition-delay:.06s}
.ap__brand{
  font-family:'Bebas Neue',sans-serif;
  font-size:1.3rem;letter-spacing:.2em;
}
.ap__progress{display:flex;align-items:center;gap:16px}
.ap__progress-label{
  font-size:9px;letter-spacing:.2em;
  color:var(--cd);text-transform:uppercase;
}
.ap__progress-n{
  font-size:11px;letter-spacing:.1em;
  color:var(--ch);
}

/* ── Layout ── */
.ap__wrap{
  flex:1;display:flex;align-items:center;
  max-width:1200px;margin:0 auto;
  padding:20px 32px 48px;gap:64px;
  width:100%;
}

/* ── Left ── */
.ap__left{
  flex:1;display:flex;flex-direction:column;
  justify-content:center;
  opacity:0;transform:translateX(-20px);
  transition:opacity .6s ease,transform .6s cubic-bezier(.34,1.56,.64,1);
}
.ap__left--on{opacity:1;transform:translateX(0);transition-delay:.12s}

.ap__hd{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(3rem,7vw,6rem);
  line-height:.9;letter-spacing:-.01em;
  margin-bottom:24px;
}
.ap__ln{
  display:block;
  opacity:0;transform:translateY(35px);
  transition:opacity .6s ease,transform .6s cubic-bezier(.34,1.56,.64,1);
}
.ap__left--on .ap__ln:nth-child(1){opacity:1;transform:translateY(0);transition-delay:.2s}
.ap__left--on .ap__ln:nth-child(2){opacity:1;transform:translateY(0);transition-delay:.28s}
.ap__left--on .ap__ln:nth-child(3){opacity:1;transform:translateY(0);transition-delay:.36s}
.ap__ln--y{color:var(--y)}

.ap__sub{
  font-size:13px;line-height:1.7;color:var(--m);
  max-width:360px;margin-bottom:48px;
  opacity:0;transform:translateY(12px);
  transition:opacity .6s ease,transform .6s ease;
}
.ap__left--on .ap__sub{opacity:1;transform:translateY(0);transition-delay:.48s}

.ap__meta{
  display:flex;align-items:center;gap:14px;
  opacity:0;transform:translateY(12px);
  transition:opacity .5s ease,transform .5s ease;
}
.ap__left--on .ap__meta{opacity:1;transform:translateY(0);transition-delay:.58s}
.ap__meta-brand{
  font-family:'Bebas Neue',sans-serif;
  font-size:11px;letter-spacing:.2em;color:var(--cd);
}
.ap__meta-line{width:32px;height:1px;background:var(--b)}
.ap__meta-info{font-size:9px;letter-spacing:.18em;color:var(--cd)}

/* ── Right ── */
.ap__right{
  flex:1;max-width:420px;
  opacity:0;transform:translateX(20px);
  transition:opacity .6s ease .08s,transform .6s cubic-bezier(.34,1.56,.64,1) .08s;
}
.ap__right--on{opacity:1;transform:translateX(0)}

/* ── Alias list ── */
.ap__list{display:flex;flex-direction:column;gap:8px;margin-bottom:24px}

.ap__opt{
  display:flex;align-items:center;gap:16px;
  width:100%;padding:16px 20px;
  background:var(--bg2);
  border:1px solid var(--b);
  border-radius:14px;
  text-align:left;
  opacity:0;transform:translateY(14px);
  animation:optIn .45s ease forwards;
  transition:background .3s,border-color .3s,box-shadow .3s;
}
@keyframes optIn{
  to{opacity:1;transform:translateY(0)}
}
.ap__opt:hover{
  border-color:rgba(191,195,199,.18);
  background:#161616;
}
.ap__opt--on{
  border-color:rgba(229,255,0,.3);
  background:rgba(229,255,0,.03);
  box-shadow:0 0 0 1px rgba(229,255,0,.06),0 0 20px rgba(229,255,0,.03);
}
.ap__opt--on:hover{
  border-color:rgba(229,255,0,.4);
}

.ap__opt-idx{
  font-size:10px;letter-spacing:.14em;
  color:var(--cd);width:20px;flex-shrink:0;
}
.ap__opt-name{
  flex:1;font-size:14px;font-weight:500;
  color:var(--t);letter-spacing:.02em;
}
.ap__opt--on .ap__opt-name{color:var(--yb)}

.ap__opt-radio{
  width:20px;height:20px;border-radius:50%;
  border:1.5px solid var(--b);
  flex-shrink:0;display:flex;align-items:center;justify-content:center;
  transition:border-color .3s,background .3s;
}
.ap__opt--on .ap__opt-radio{
  border-color:var(--y);
}
.ap__opt-radio-dot{
  width:8px;height:8px;border-radius:50%;
  background:var(--y);
  box-shadow:0 0 6px rgba(229,255,0,.4);
  animation:radioIn .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes radioIn{
  from{transform:scale(0);opacity:0}
  to{transform:scale(1);opacity:1}
}

/* ── Regenerate ── */
.ap__regen{
  display:flex;align-items:center;justify-content:space-between;
  padding:0 4px;margin-bottom:28px;
}
.ap__regen-btn{
  display:inline-flex;align-items:center;gap:10px;
  font-size:11px;letter-spacing:.12em;
  color:var(--ch);
  padding:10px 16px;
  border:1px solid var(--b);
  border-radius:100px;
  transition:all .3s ease;
}
.ap__regen-btn:hover{
  border-color:var(--ch);color:var(--t);
}
.ap__regen-btn--off{
  opacity:.35;cursor:not-allowed;
}
.ap__regen-btn--off:hover{
  border-color:var(--b);color:var(--ch);
}
.ap__regen-ic{font-size:14px}
.ap__regen-label{font-size:10px}
.ap__regen-count{
  font-size:10px;letter-spacing:.1em;
  color:var(--cd);
}

/* ── Confirmation ── */
.ap__confirm{
  border-top:1px solid var(--b);
  padding-top:24px;
  animation:confirmIn .4s ease;
}
@keyframes confirmIn{
  from{opacity:0;transform:translateY(10px)}
  to{opacity:1;transform:translateY(0)}
}

.ap__perm{
  font-size:11px;line-height:1.7;color:var(--cd);
  margin-bottom:24px;
}
.ap__perm-head{
  font-size:10px;letter-spacing:.2em;
  color:var(--ch);font-weight:600;
  display:block;margin-bottom:4px;
}

/* ── CTA ── */
.ap__cta{
  display:flex;align-items:center;justify-content:center;gap:10px;
  width:100%;padding:18px 32px;
  background:var(--y);color:#000;
  font-family:'DM Mono',monospace;
  font-size:12px;letter-spacing:.14em;
  font-weight:600;
  border-radius:14px;
  position:relative;overflow:hidden;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);
}
.ap__cta::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);
  transform:translateX(-100%);transition:transform .5s ease;
}
.ap__cta:hover:not(:disabled)::before{transform:translateX(100%)}
.ap__cta:hover:not(:disabled){
  transform:scale(1.02);
  box-shadow:0 0 30px rgba(229,255,0,.3),0 0 80px rgba(229,255,0,.08);
}
.ap__cta:active:not(:disabled){transform:scale(.98)}
.ap__cta:disabled{opacity:.55;cursor:not-allowed}
.ap__cta-arr{
  display:inline-block;transition:transform .3s ease;
}
.ap__cta:hover:not(:disabled) .ap__cta-arr{transform:translateX(4px)}

.ap__cta-saving{display:inline-flex;align-items:center;gap:4px}
.ap__cta-dots{display:inline-flex;gap:2px}
.ap__cta-dot{font-size:18px;line-height:1;animation:dotP 1.2s infinite;opacity:.2}
.ap__cta-dot:nth-child(1){animation-delay:0s}
.ap__cta-dot:nth-child(2){animation-delay:.2s}
.ap__cta-dot:nth-child(3){animation-delay:.4s}
@keyframes dotP{0%,60%,100%{opacity:.15}30%{opacity:1}}

/* ── Messages ── */
.ap__msg{
  margin-top:16px;padding:14px 16px;
  border-radius:12px;display:flex;align-items:flex-start;gap:10px;
}
.ap__msg--err{
  background:rgba(255,255,255,.02);
  border:1px solid rgba(220,60,60,.18);
}
.ap__msg--ok{
  background:rgba(229,255,0,.02);
  border:1px solid rgba(229,255,0,.15);
}
.ap__msg-dot{
  width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:5px;
}
.ap__msg-dot--err{background:rgba(255,100,100,.6)}
.ap__msg-dot--ok{background:var(--y);box-shadow:0 0 4px rgba(229,255,0,.4)}
.ap__msg-text{font-size:12px;line-height:1.6;color:var(--m)}

/* ═══ RESPONSIVE ═══ */
@media(max-width:1024px){
  .ap__wrap{gap:40px;padding:20px 24px 48px}
}
@media(max-width:768px){
  .ap__wrap{
    flex-direction:column;align-items:stretch;
    gap:32px;padding:16px 20px 40px;
  }
  .ap__left{transform:none;text-align:center;align-items:center}
  .ap__left--on{transform:none}
  .ap__hd{font-size:clamp(2.5rem,10vw,3.5rem)}
  .ap__sub{text-align:center;max-width:none}
  .ap__meta{justify-content:center}
  .ap__right{max-width:none;transform:none}
  .ap__right--on{transform:none}
  .ap__bar{padding:16px 20px}
  .ap__opt{padding:14px 16px}
  .ap__opt-name{font-size:13px}
  .ap__cta{padding:16px 24px;font-size:11px}
}

/* ═══ REDUCED MOTION ═══ */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms!important;
    transition-duration:.01ms!important;
  }
  .cd,.ch{display:none!important}
  .ap__bar,.ap__left,.ap__right,.ap__ln,.ap__sub,.ap__meta,.ap__opt,.ap__confirm{
    opacity:1!important;transform:none!important;
  }
}
`;