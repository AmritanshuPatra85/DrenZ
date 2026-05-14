"use client";

import { useState } from "react";

type Props = {
  images: string[];
  alt?: string;
};

export default function PhotoGallery({ images, alt = "listing photo" }: Props) {
  const [current, setCurrent] = useState(0);
  const [scale,   setScale]   = useState(1);

  const photos = images.length > 0 ? images : [];
  const hasPhotos = photos.length > 0;

  const prev = () => {
    setScale(1);
    setCurrent(i => (i - 1 + photos.length) % photos.length);
  };

  const next = () => {
    setScale(1);
    setCurrent(i => (i + 1) % photos.length);
  };

  const toggleZoom = () => setScale(s => s === 1 ? 2 : 1);

  if (!hasPhotos) {
    return (
      <div className="bg-brand-card rounded-2xl h-72 flex items-center justify-center border border-white/5">
        <span className="text-8xl">👕</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-brand-card" style={{ height: 288 }}>

      {/* Image */}
      <div className="w-full h-full overflow-hidden flex items-center justify-center">
        <img
          src={photos[current]}
          alt={`${alt} ${current + 1}`}
          onClick={toggleZoom}
          className="w-full h-full object-cover transition-transform duration-300 cursor-zoom-in"
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      {/* Prev / Next arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm"
          >
            ›
          </button>
        </>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setScale(1); }}
              className={`rounded-full transition-all ${
                i === current
                  ? "bg-brand-yellow w-4 h-1.5"
                  : "bg-white/40 w-1.5 h-1.5"
              }`}
            />
          ))}
        </div>
      )}

      {/* Photo count badge */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full">
        {current + 1}/{photos.length}
      </div>

      {/* Zoom hint */}
      {scale === 1 && (
        <div className="absolute bottom-3 right-3 bg-black/50 text-white/60 text-[10px] px-2 py-1 rounded-full">
          tap to zoom
        </div>
      )}
    </div>
  );
}

