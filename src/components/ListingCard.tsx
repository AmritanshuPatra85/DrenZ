"use client";

import Link from "next/link";
import { useState } from "react";

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

const CONDITION_STYLES: Record<string, { bg: string; text: string }> = {
  "Like New": { bg: "bg-green-950",  text: "text-green-400"  },
  "Good":     { bg: "bg-lime-950",   text: "text-lime-400"   },
  "Fair":     { bg: "bg-orange-950", text: "text-orange-400" },
};

export default function ListingCard({ listing }: { listing: Listing }) {
  const [liked, setLiked] = useState(listing.is_liked ?? false);
  const condition = listing.condition ?? "Good";
  const condStyle = CONDITION_STYLES[condition] ?? { bg: "bg-white/10", text: "text-white/50" };

  return (
    <Link href={`/listing/${listing.id}`} className="block">
      <div className="bg-brand-card rounded-2xl overflow-hidden border border-white/5 hover:border-brand-yellow/30 transition-colors">

        {/* Photo */}
        <div className="relative bg-white/5 h-36 flex items-center justify-center">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">👕</span>
          )}

          {/* Like button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className="absolute top-2 right-2 bg-black/50 rounded-full w-7 h-7 flex items-center justify-center text-sm"
          >
            {liked ? "❤️" : "🤍"}
          </button>

          {/* Size badge */}
          {listing.size && (
            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {listing.size}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-white text-sm font-semibold truncate mb-1">
            {listing.title}
          </p>

          <div className="flex items-center justify-between mb-2">
            <span className="text-brand-yellow font-bold text-base">
              ₹{listing.price}
            </span>
            {listing.condition && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${condStyle.bg} ${condStyle.text}`}>
                {listing.condition}
              </span>
            )}
          </div>

          {/* Seller */}
          {listing.seller_alias && (
            <p className="text-white/40 text-[10px] truncate">
              {listing.seller_alias}
              {listing.seller_dept ? ` · ${listing.seller_dept}` : ""}
            </p>
          )}
        </div>

      </div>
    </Link>
  );
}