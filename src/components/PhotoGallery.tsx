"use client";

import { useState, useEffect } from "react";

type Props = {
  images: string[];
  alt?: string;
};

export default function PhotoGallery({ images, alt = "listing photo" }: Props) {
  const [current, setCurrent] = useState(0);
  const [scale, setScale] = useState(1);
  const [fadeKey, setFadeKey] = useState(0);
  const [reduced, setReduced] = useState(false);

  const photos = images.length > 0 ? images : [];
  const hasPhotos = photos.length > 0;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  const go = (index: number) => {
    setScale(1);
    setFadeKey((k) => k + 1);
    setCurrent(index);
  };

  const prev = () => {
    go((current - 1 + photos.length) % photos.length);
  };

  const next = () => {
    go((current + 1) % photos.length);
  };

  const toggleZoom = () => setScale((s) => (s === 1 ? 2 : 1));

  const pad = (n: number) => String(n).padStart(2, "0");

  /* ── Empty state ── */
  if (!hasPhotos) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#111111] border border-[#292929] flex items-center justify-center">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative flex flex-col items-center gap-3">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#686D72] opacity-25"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="text-[10px] tracking-[0.2em] text-[#686D72] uppercase">
            Photo unavailable
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-[#111111] border border-[#292929]">
      {/* ── Image area ── */}
      <div className="relative aspect-[4/5] w-full">
        <img
          key={fadeKey}
          src={photos[current]}
          alt={`${alt} ${current + 1}`}
          onClick={toggleZoom}
          className={`w-full h-full object-cover ${
            reduced ? "" : "transition-transform duration-300 ease-out"
          } ${scale === 1 ? "cursor-zoom-in" : "cursor-zoom-out"}`}
          style={{ transform: `scale(${scale})` }}
        />

        {/* ── Photo count ── */}
        <div className="absolute top-3 right-3 flex items-center bg-black/50 backdrop-blur-md rounded-md px-2.5 py-1 border border-white/[0.06]">
          <span className="text-[10px] tracking-[0.14em] text-[#BFC3C7] font-medium">
            {pad(current + 1)}&nbsp;/&nbsp;{pad(photos.length)}
          </span>
        </div>

        {/* ── Prev / Next ── */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-[#BFC3C7] transition-all duration-200 hover:bg-black/60 hover:text-white hover:scale-105 active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-[#BFC3C7] transition-all duration-200 hover:bg-black/60 hover:text-white hover:scale-105 active:scale-95"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* ── Dot indicators ── */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                aria-label={`View photo ${i + 1}`}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === current
                    ? "bg-[#E5FF00] w-4 h-1.5"
                    : "bg-white/30 w-1.5 h-1.5 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Zoom hint ── */}
        {scale === 1 && (
          <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md rounded-md px-2 py-1 border border-white/[0.06]">
            <span className="text-[9px] tracking-[0.14em] uppercase text-[#686D72]">
              Tap to zoom
            </span>
          </div>
        )}
      </div>
    </div>
  );
}