"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";

const QUICK_TAGS = [
  "Great condition", "Exactly as described", "Fast response",
  "Easy meetup", "Trustworthy", "Would buy again",
  "Poor condition", "Late to meetup", "Unresponsive",
];

export default function RatingPage() {
  const router = useRouter();
  const [stars,     setStars]     = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [tags,      setTags]      = useState<string[]>([]);
  const [comment,   setComment]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (stars === 0) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) return (
    <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-4">
        {stars === 5 ? "🎉" : stars >= 3 ? "👍" : "🙏"}
      </div>
      <h2 className="text-white font-black text-2xl mb-2">Thanks for rating!</h2>
      <p className="text-white/50 text-sm mb-8">Your feedback keeps drenZ trustworthy.</p>
      <button
        onClick={() => router.push("/home")}
        className="bg-brand-yellow text-black font-bold px-8 py-4 rounded-2xl w-full"
      >
        Back to Home
      </button>
    </main>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-32">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">Rate this deal</h1>
        <div className="w-12" />
      </div>

      <div className="px-4 space-y-6">

        {/* Stars */}
        <div className="bg-brand-card border border-white/10 rounded-2xl p-6 text-center">
          <p className="text-white/50 text-sm mb-4">How was your experience?</p>
          <div className="flex justify-center gap-3 mb-3">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setStars(star)}
                className="text-4xl transition-transform hover:scale-110"
              >
                <span style={{
                  filter: (hovered || stars) >= star
                    ? "none"
                    : "grayscale(100%) opacity(0.3)",
                  color: "#F5A623"
                }}>★</span>
              </button>
            ))}
          </div>
          <p className="text-white/40 text-xs">
            {stars === 0 && "Tap to rate"}
            {stars === 1 && "Poor"}
            {stars === 2 && "Fair"}
            {stars === 3 && "Good"}
            {stars === 4 && "Great"}
            {stars === 5 && "Amazing! 🎉"}
          </p>
        </div>

        {/* Quick tags */}
        {stars > 0 && (
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3">Quick tags</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    tags.includes(tag)
                      ? "bg-brand-yellow text-black"
                      : "bg-brand-card border border-white/10 text-white/60"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comment */}
        {stars > 0 && (
          <div>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">
              Comment <span className="normal-case text-white/30">(optional)</span>
            </p>
            <textarea
              placeholder="Tell others about this deal…"
              value={comment}
              onChange={e => {
                if (e.target.value.length <= 140) setComment(e.target.value);
              }}
              rows={3}
              className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50 resize-none"
            />
            <p className="text-white/30 text-xs text-right mt-1">{comment.length}/140</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3 bg-brand-dark border-t border-white/5">
        <button
          onClick={handleSubmit}
          disabled={stars === 0 || loading}
          className={`w-full font-bold text-base py-4 rounded-2xl transition-opacity ${
            stars > 0 ? "bg-brand-yellow text-black" : "bg-white/10 text-white/30"
          } disabled:opacity-50`}
        >
          {loading ? "Submitting…" : "Submit Rating →"}
        </button>
        <button
          onClick={() => router.push("/home")}
          className="w-full text-center text-white/30 text-xs py-2 mt-1"
        >
          Skip for now
        </button>
      </div>

      <BottomNav />
    </main>
  );
}