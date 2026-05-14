"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import { uploadListingImage } from "@/lib/image-utils";

const CATEGORIES = ["Tops", "Bottoms", "Shoes", "Bags", "Accessories"];
const CONDITIONS = ["Like New", "Good", "Fair"];
const SIZES      = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

export default function CreateListing() {
  const router = useRouter();
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [images,      setImages]      = useState<File[]>([]);
  const [previews,    setPreviews]    = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "", category: "", condition: "", size: "", brand: "", price: "", description: "",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const isValid = form.title && form.category && form.condition && form.size && form.price;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }

    // Upload images
    setUploading(true);
    const imageUrls: string[] = [];
    for (const file of images) {
      const url = await uploadListingImage(file, user.id);
      if (url) imageUrls.push(url);
    }
    setUploading(false);

    const { error } = await supabase.from("listings").insert({
      title:       form.title,
      category:    form.category,
      condition:   form.condition,
      size:        form.size,
      brand:       form.brand || null,
      price:       Number(form.price),
      description: form.description || null,
      seller_id:   user.id,
      status:      "active",
      image_url:   imageUrls[0] ?? null,
      image_urls:  imageUrls,
    });

    setSubmitting(false);
    if (!error) setSubmitted(true);
  };

  if (submitted) return (
    <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 text-center">
      <span className="text-6xl mb-4">🎉</span>
      <h2 className="text-white font-black text-2xl mb-2">Listing Live!</h2>
      <p className="text-white/50 text-sm mb-8">Your item is now visible to campus buyers.</p>
      <button onClick={() => router.push("/home")}
        className="bg-brand-yellow text-black font-bold px-8 py-4 rounded-2xl w-full">
        Back to Home
      </button>
      <button onClick={() => {
        setSubmitted(false);
        setImages([]);
        setPreviews([]);
        setForm({ title:"", category:"", condition:"", size:"", brand:"", price:"", description:"" });
      }}
        className="mt-3 text-white/40 text-sm">
        List another item
      </button>
    </main>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-32">

      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">New Listing</h1>
        <div className="w-12" />
      </div>

      {/* Photo upload */}
      <div className="mx-4 mb-5">
        <div className="bg-brand-card border-2 border-dashed border-white/20 rounded-2xl p-4">
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} className="w-full h-full object-cover rounded-xl" />
                  <button
                    onClick={() => {
                      setImages(prev => prev.filter((_, j) => j !== i));
                      setPreviews(prev => prev.filter((_, j) => j !== i));
                    }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >✕</button>
                </div>
              ))}
            </div>
          )}
          {previews.length < 4 && (
            <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-4">
              <span className="text-3xl">📷</span>
              <p className="text-white/40 text-sm">Tap to add photos</p>
              <p className="text-white/20 text-xs">{previews.length}/4 photos</p>
              <input
                type="file" accept="image/*" multiple className="hidden"
                onChange={e => {
                  const files = Array.from(e.target.files ?? []).slice(0, 4 - images.length);
                  setImages(prev => [...prev, ...files]);
                  files.forEach(f => {
                    const reader = new FileReader();
                    reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string]);
                    reader.readAsDataURL(f);
                  });
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Title */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Title *</label>
          <input
            type="text" placeholder="e.g. H&M Oversized Hoodie"
            value={form.title} onChange={e => set("title", e.target.value)}
            className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Category *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => set("category", c)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  form.category === c ? "bg-brand-yellow text-black" : "bg-brand-card border border-white/10 text-white/60"
                }`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Condition *</label>
          <div className="flex gap-2">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => set("condition", c)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  form.condition === c ? "bg-brand-yellow text-black" : "bg-brand-card border border-white/10 text-white/60"
                }`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Size *</label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => (
              <button key={s} onClick={() => set("size", s)}
                className={`px-4 py-2 rounded-full text-xs font-semibond transition-colors ${
                  form.size === s ? "bg-brand-yellow text-black" : "bg-brand-card border border-white/10 text-white/60"
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Brand */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Brand</label>
          <input
            type="text" placeholder="e.g. Zara, H&M, Nike (optional)"
            value={form.brand} onChange={e => set("brand", e.target.value)}
            className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
          />
        </div>

        {/* Price */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Price (₹) *</label>
          <input
            type="number" placeholder="e.g. 499"
            value={form.price} onChange={e => set("price", e.target.value)}
            className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Description</label>
          <textarea
            placeholder="Describe your item — size fit, wear, any flaws…"
            value={form.description} onChange={e => set("description", e.target.value)}
            rows={3}
            className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50 resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3 bg-brand-dark border-t border-white/5">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting || uploading}
          className={`w-full font-bold text-base py-4 rounded-2xl transition-opacity ${
            isValid ? "bg-brand-yellow text-black" : "bg-white/10 text-white/30"
          } disabled:opacity-50`}
        >
          {uploading ? "Uploading photos…" : submitting ? "Publishing…" : "Publish Listing →"}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}