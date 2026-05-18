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
    <main className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-white font-bold text-lg text-center">My Profile</h1>
      </div>

      {/* Avatar + alias */}
      <div className="flex flex-col items-center px-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-brand-yellow/20 border-2 border-brand-yellow flex items-center justify-center text-3xl font-black text-brand-yellow mb-3">
          {profile?.alias?.[0]?.toUpperCase() ?? "?"}
        </div>
        <h2 className="text-white font-black text-xl">{profile?.alias ?? "Anonymous"}</h2>
        <p className="text-white/40 text-sm mt-1">{profile?.department} · {profile?.year}</p>

        {/* Trust metrics */}
        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <p className="text-brand-yellow font-black text-lg">{profile?.avg_rating?.toFixed(1) ?? "—"}</p>
            <p className="text-white/40 text-xs">Rating</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-brand-yellow font-black text-lg">{profile?.total_reviews ?? 0}</p>
            <p className="text-white/40 text-xs">Reviews</p>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <p className="text-brand-yellow font-black text-lg">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
            </p>
            <p className="text-white/40 text-xs">Joined</p>
          </div>
        </div>
      </div>

      {/* Nav cards */}
      <div className="px-4 space-y-3 mb-6">
        {[
          { label: "My Listings",    emoji: "📦", href: "/my-listings"  },
          { label: "My Purchases",   emoji: "🛍️", href: "/my-purchases" },
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <div className="bg-brand-card border border-white/10 rounded-2xl px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.emoji}</span>
                <span className="text-white font-semibold text-sm">{item.label}</span>
              </div>
              <span className="text-white/30">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Settings */}
      <div className="px-4 space-y-3">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Settings</p>
        {[
          { label: "Edit Profile",        emoji: "✏️" },
           { label: "Payout Settings", emoji: "💳", href: "/payout-settings" },
          { label: "Notifications",       emoji: "🔔" },
        ].map(item => (
          <button key={item.label} className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-white font-semibold text-sm">{item.label}</span>
            </div>
            <span className="text-white/30">→</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full bg-red-950 border border-red-800 rounded-2xl px-4 py-4 flex items-center gap-3"
        >
          <span className="text-xl">🚪</span>
          <span className="text-red-400 font-semibold text-sm">Logout</span>
        </button>
      </div>

      <BottomNav />
    </main>
  );
}