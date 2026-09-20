"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import { uploadListingImage } from "@/lib/image-utils";

const CATEGORIES = [
  { value: "tops", label: "Tops" },
  { value: "bottoms", label: "Bottoms" },
  { value: "shoes", label: "Shoes" },
  { value: "bags", label: "Bags" },
  { value: "accessories", label: "Accessories" },
];

const CONDITIONS = [
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

function SellForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEdit = !!editId;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    condition: "",
    size: "",
    brand: "",
    price: "",
    description: "",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!editId) return;
    const load = async () => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", editId)
        .single();
      if (data) {
        setForm({
          title: data.title ?? "",
          category: data.category ?? "",
          condition: data.condition ?? "",
          size: data.size ?? "",
          brand: data.brand ?? "",
          price: String(data.price ?? ""),
          description: data.description ?? "",
        });
        setExistingImages(
          data.image_urls ?? (data.image_url ? [data.image_url] : [])
        );
        setPreviews(
          data.image_urls ?? (data.image_url ? [data.image_url] : [])
        );
      }
      setLoading(false);
    };
    load();
  }, [editId]);

  const set = (key: string, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));
  const isValid = form.title && form.category && form.condition && form.price;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    setUploading(true);
    const newImageUrls: string[] = [];
    for (const file of images) {
      const result = await uploadListingImage(file, user.id);
      if (result.blocked) {
        setUploading(false);
        setSubmitting(false);
        alert(
          "One of your images was flagged as inappropriate and could not be uploaded."
        );
        return;
      }
      if (result.url) newImageUrls.push(result.url);
    }
    setUploading(false);

    const allImages = [...existingImages, ...newImageUrls];

    if (isEdit) {
      const { error } = await supabase
        .from("listings")
        .update({
          title: form.title,
          category: form.category,
          condition: form.condition,
          price: Number(form.price),
          brand: form.brand || null,
          description: form.description || null,
          image_url: allImages[0] ?? null,
          image_urls: allImages,
        })
        .eq("id", editId);

      setSubmitting(false);
      if (error) {
        alert(error.message);
        return;
      }
      router.push(`/listing/${editId}`);
    } else {
      const { error } = await supabase.from("listings").insert({
        title: form.title,
        category: form.category,
        condition: form.condition,
        price: Number(form.price),
        brand: form.brand || null,
        description: form.description || null,
        seller_id: user.id,
        status: "active",
        image_url: allImages[0] ?? null,
        image_urls: allImages,
        college: "KIIT",
      });

      setSubmitting(false);
      if (error) {
        alert(error.message);
        return;
      }
      setSubmitted(true);
    }
  };

  const removeImage = (i: number) => {
    const isExisting = i < existingImages.length;
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, j) => j !== i));
    } else {
      setImages((prev) =>
        prev.filter((_, j) => j !== i - existingImages.length)
      );
    }
    setPreviews((prev) => prev.filter((_, j) => j !== i));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(
      0,
      4 - images.length
    );
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ═══════════════════════ LOADING ═══════════════════════ */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-32">
        <div className="mx-auto max-w-6xl px-4 md:px-8 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-3 w-16 bg-[#292929] rounded animate-pulse" />
            <div className="h-3 w-12 bg-[#292929] rounded animate-pulse" />
          </div>
          <div className="h-3 w-24 bg-[#292929] rounded animate-pulse mb-2" />
          <div className="h-6 w-48 bg-[#292929] rounded animate-pulse mb-8" />
          <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-12">
            <div className="aspect-[4/5] bg-[#111111] rounded-xl animate-pulse" />
            <div className="mt-6 lg:mt-0 space-y-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-2 w-20 bg-[#292929] rounded animate-pulse mb-2" />
                  <div className="h-10 w-full bg-[#292929] rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </main>
    );
  }

  /* ═══════════════════════ SUCCESS ═══════════════════════ */
  if (submitted) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-[#E5FF00]/10 border border-[#E5FF00]/20 flex items-center justify-center mx-auto mb-6">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E5FF00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            LISTING LIVE
          </h2>
          <p className="text-sm text-[#969696] mb-8 leading-relaxed">
            Your piece is now visible to campus buyers.
          </p>
          <button
            onClick={() => router.push("/home")}
            className="group w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
          >
            BACK TO HOME
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setImages([]);
              setPreviews([]);
              setExistingImages([]);
              setForm({
                title: "",
                category: "",
                condition: "",
                size: "",
                brand: "",
                price: "",
                description: "",
              });
            }}
            className="mt-3 text-[11px] text-[#686D72] hover:text-[#969696] transition-colors duration-200"
          >
            List another item
          </button>
        </div>
      </main>
    );
  }

  /* ═══════════════════════ MAIN ═══════════════════════ */
  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-32 lg:pb-16">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        {/* ── Header ── */}
        <header className="pt-6 pb-5 lg:pt-8 lg:pb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
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
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              BACK
            </button>
            <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
              DRENZ
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            DRENZ STUDIO
          </h1>
          <p className="mt-1 text-sm text-[#969696]">
            {isEdit ? "Edit your listing." : "List a piece from your closet."}
          </p>
        </header>

        {/* ── Two-column layout ── */}
        <div className="lg:grid lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          {/* ═══ LEFT: Photo Workspace ═══ */}
          <div className="lg:sticky lg:top-8">
            <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
              PHOTO WORKSPACE
            </span>

            {previews.length > 0 ? (
              <>
                {/* Hero image */}
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-[#292929] bg-[#111111]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previews[0]}
                    alt={form.title || "Product photo"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(0)}
                    aria-label="Remove photo"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-white/70 transition-all duration-200 hover:bg-red-500/40 hover:text-white hover:border-red-500/30"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md rounded-md px-2.5 py-1 border border-white/[0.06]">
                    <span className="text-[10px] tracking-[0.14em] text-[#BFC3C7] font-medium">
                      {String(previews.length).padStart(2, "0")} / 04
                    </span>
                  </div>
                </div>

                {/* Thumbnail strip */}
                <div className="flex items-center gap-2 mt-2">
                  {previews.slice(1).map((src, i) => (
                    <div
                      key={i + 1}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#292929] bg-[#111111] shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${form.title} photo ${i + 2}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(i + 1)}
                        aria-label="Remove photo"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white/70 transition-all duration-200 hover:bg-red-500/40 hover:text-white"
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {previews.length < 4 && (
                    <button
                      onClick={() => fileRef.current?.click()}
                      aria-label="Add photo"
                      className="w-16 h-16 rounded-lg border border-dashed border-[#292929] bg-[#111111] flex items-center justify-center text-[#686D72] transition-all duration-200 hover:border-[#686D72] hover:text-[#969696] shrink-0"
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
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-[4/5] rounded-xl border border-dashed border-[#292929] bg-[#111111] flex flex-col items-center justify-center gap-4 transition-all duration-200 hover:border-[#686D72]"
              >
                <div className="w-14 h-14 rounded-full bg-[#151515] border border-[#292929] flex items-center justify-center">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#686D72"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#969696] uppercase">
                    Add Product Photos
                  </p>
                  <p className="text-[10px] text-[#686D72] mt-1">
                    Show your piece from its best angle.
                  </p>
                </div>
                <span className="text-[10px] tracking-[0.12em] text-[#686D72]">
                  0 / 4
                </span>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </div>

          {/* ═══ RIGHT: Product Details ═══ */}
          <div className="mt-6 lg:mt-0">
            <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-5">
              PRODUCT DETAILS
            </span>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  TITLE <span className="text-[#E5FF00]/60">*</span>
                </label>
                <input
                  type="text"
                  placeholder="H&M Oversized Hoodie"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="w-full bg-[#111111] border border-[#292929] rounded-lg px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#686D72] outline-none transition-colors duration-200 focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  CATEGORY <span className="text-[#E5FF00]/60">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => set("category", c.value)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] tracking-[0.06em] font-medium transition-all duration-200 ${
                        form.category === c.value
                          ? "bg-[#E5FF00] text-[#080808]"
                          : "bg-[#151515] border border-[#292929] text-[#969696] hover:text-[#BFC3C7] hover:border-[#BFC3C7]/20"
                      }`}
                    >
                      {c.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  CONDITION <span className="text-[#E5FF00]/60">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => set("condition", c.value)}
                      className={`px-3.5 py-1.5 rounded-lg text-[11px] tracking-[0.06em] font-medium transition-all duration-200 ${
                        form.condition === c.value
                          ? "bg-[#E5FF00] text-[#080808]"
                          : "bg-[#151515] border border-[#292929] text-[#969696] hover:text-[#BFC3C7] hover:border-[#BFC3C7]/20"
                      }`}
                    >
                      {c.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  SIZE
                </label>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => set("size", s)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] tracking-[0.06em] font-medium transition-all duration-200 ${
                        form.size === s
                          ? "bg-[#E5FF00] text-[#080808]"
                          : "bg-[#151515] border border-[#292929] text-[#969696] hover:text-[#BFC3C7] hover:border-[#BFC3C7]/20"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  BRAND <span className="font-normal">(OPTIONAL)</span>
                </label>
                <input
                  type="text"
                  placeholder="Zara, H&M, Nike"
                  value={form.brand}
                  onChange={(e) => set("brand", e.target.value)}
                  className="w-full bg-[#111111] border border-[#292929] rounded-lg px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#686D72] outline-none transition-colors duration-200 focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  PRICE <span className="text-[#E5FF00]/60">*</span>
                </label>
                <div className="flex items-center bg-[#111111] border border-[#292929] rounded-lg px-4 transition-colors duration-200 focus-within:border-[#E5FF00]/30 focus-within:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]">
                  <span className="text-[#E5FF00] text-lg font-semibold mr-2">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="499"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    className="flex-1 bg-transparent py-3 text-sm text-[#F5F5F5] placeholder-[#686D72] outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  placeholder="Tell buyers what makes this piece worth picking up."
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={4}
                  className="w-full bg-[#111111] border border-[#292929] rounded-lg px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#686D72] outline-none transition-colors duration-200 focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)] resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:block mt-8">
              <button
                onClick={handleSubmit}
                disabled={!isValid || submitting || uploading}
                className={`group w-full flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold tracking-[0.1em] transition-all duration-200 ${
                  isValid
                    ? "bg-[#E5FF00] text-[#080808] hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
                    : "bg-[#151515] text-[#686D72] border border-[#292929] cursor-not-allowed"
                } disabled:opacity-50`}
              >
                {uploading ? (
                  "UPLOADING PHOTOS..."
                ) : submitting ? (
                  "SAVING..."
                ) : (
                  <>
                    {isEdit ? "SAVE CHANGES" : "PUBLISH LISTING"}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-200 group-hover:translate-x-0.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed CTA ── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 pt-3 bg-gradient-to-t from-[#080808] via-[#080808] to-[#080808]/0 lg:hidden z-40">
        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting || uploading}
          className={`group w-full flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold tracking-[0.1em] transition-all duration-200 ${
            isValid
              ? "bg-[#E5FF00] text-[#080808] active:scale-[0.98]"
              : "bg-[#151515] text-[#686D72] border border-[#292929] cursor-not-allowed"
          } disabled:opacity-50`}
        >
          {uploading ? (
            "UPLOADING PHOTOS..."
          ) : submitting ? (
            "SAVING..."
          ) : (
            <>
              {isEdit ? "SAVE CHANGES" : "PUBLISH LISTING"}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      <BottomNav />
    </main>
  );
}

export default function SellPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808]" />}>
      <SellForm />
    </Suspense>
  );
}