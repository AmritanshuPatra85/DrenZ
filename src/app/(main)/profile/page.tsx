"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export default function MyProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("users")
        .select("alias, first_name, last_name, department, year, avatar_url, avg_rating, total_reviews, created_at")
        .eq("id", user.id)
        .single();

      setProfile(data ?? {
        alias: "shadow_panda",
        first_name: "Amritanshu",
        last_name: "Patra",
        department: "CSE",
        year: "2nd Year",
        avg_rating: 4.8,
        total_reviews: 12,
        created_at: new Date().toISOString(),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      {/* Header skeleton */}
      <div className="border-b border-[#292929]">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-5 md:px-8">
          <div className="h-2 w-12 bg-[#292929] rounded animate-pulse" />
          <div className="h-2 w-24 bg-[#292929] rounded animate-pulse" />
        </div>
      </div>
      <div className="mx-auto max-w-lg px-4 pt-8 md:px-8">
        {/* Avatar + identity skeleton */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#292929] animate-pulse mb-4" />
          <div className="h-4 w-32 bg-[#292929] rounded animate-pulse mb-2" />
          <div className="h-3 w-24 bg-[#292929] rounded animate-pulse mb-5" />
          {/* Metrics skeleton */}
          <div className="flex items-center gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center">
                <div className="h-4 w-10 bg-[#292929] rounded animate-pulse mx-auto mb-1.5" />
                <div className="h-2 w-12 bg-[#292929] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Rows skeleton */}
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-[#292929] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
      <BottomNav />
    </main>
  );

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-24">
      {/* ── Header ── */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-lg flex items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-[#686D72] hover:text-[#E5FF00] transition-colors duration-200 uppercase"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          <span className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / PROFILE
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-8 md:px-8">
        {/* ── Title ── */}
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight mb-8">MY PROFILE</h1>

        {/* ── Identity ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#151515] border border-[#E5FF00]/25 flex items-center justify-center mb-4 overflow-hidden">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.alias ?? "Profile"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-[#E5FF00]">
                {profile?.alias?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-[#F5F5F5] tracking-tight">
            @{profile?.alias ?? "Anonymous"}
          </h2>
          <p className="text-[11px] text-[#969696] mt-1 tracking-wide">
            {profile?.department} · {profile?.year}
          </p>

          {/* ── Metrics ── */}
          <div className="flex items-center gap-5 mt-5">
            <div className="text-center">
              <p className="text-base font-bold text-[#E5FF00]">{profile?.avg_rating?.toFixed(1) ?? "—"}</p>
              <p className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">Rating</p>
            </div>
            <div className="w-px h-6 bg-[#292929]" />
            <div className="text-center">
              <p className="text-base font-bold text-[#E5FF00]">{profile?.total_reviews ?? 0}</p>
              <p className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">Reviews</p>
            </div>
            <div className="w-px h-6 bg-[#292929]" />
            <div className="text-center">
              <p className="text-base font-bold text-[#E5FF00]">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
              </p>
              <p className="text-[10px] text-[#686D72] tracking-[0.14em] uppercase mt-0.5">Joined</p>
            </div>
          </div>
        </div>

        {/* ── Activity ── */}
        <div className="mb-6">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
            ACTIVITY
          </span>
          <div className="space-y-2">
            {[
              {
                label: "My Listings",
                href: "/my-listings",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                ),
              },
              {
                label: "My Purchases",
                href: "/my-purchases",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                ),
              },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="group bg-[#111111] border border-[#292929] rounded-xl px-4 py-3.5 flex items-center justify-between transition-all duration-200 hover:border-[#686D72]/30 hover:-translate-y-px">
                  <div className="flex items-center gap-3">
                    <span className="text-[#686D72] group-hover:text-[#BFC3C7] transition-colors duration-200">
                      {item.icon}
                    </span>
                    <span className="text-[13px] font-semibold text-[#F5F5F5]">{item.label}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-200 group-hover:translate-x-0.5 group-hover:stroke-[#E5FF00]">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="mb-6">
          <span className="block text-[10px] font-semibold tracking-[0.22em] text-[#686D72] uppercase mb-3">
            SETTINGS
          </span>
          <div className="space-y-2">
            {[
              {
                label: "Edit Profile",
                href: undefined,
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                ),
              },
              {
                label: "Payout Settings",
                href: "/payout-settings",
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                ),
              },
              {
                label: "Notifications",
                href: undefined,
                icon: (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                ),
              },
            ].map(item => {
              const RowContent = () => (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-[#686D72] group-hover:text-[#BFC3C7] transition-colors duration-200">
                      {item.icon}
                    </span>
                    <span className="text-[13px] font-semibold text-[#F5F5F5]">{item.label}</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#686D72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-200 group-hover:translate-x-0.5 group-hover:stroke-[#E5FF00]">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              );

              if (item.href) {
                return (
                  <Link key={item.label} href={item.href}>
                    <div className="group bg-[#111111] border border-[#292929] rounded-xl px-4 py-3.5 flex items-center justify-between transition-all duration-200 hover:border-[#686D72]/30 hover:-translate-y-px">
                      <RowContent />
                    </div>
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  className="group w-full bg-[#111111] border border-[#292929] rounded-xl px-4 py-3.5 flex items-center justify-between transition-all duration-200 hover:border-[#686D72]/30 hover:-translate-y-px"
                >
                  <RowContent />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          className="group w-full bg-[#111111] border border-[#3d1a1a] rounded-xl px-4 py-3.5 flex items-center gap-3 transition-all duration-200 hover:bg-[#2a1215] hover:border-[#e55555]/30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e55555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-[13px] font-semibold text-[#e55555]">LOG OUT</span>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}