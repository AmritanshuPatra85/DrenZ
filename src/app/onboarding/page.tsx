"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Profile = {
  phone?: string | null;
  alias?: string | null;
  trust_explainer_seen?: boolean | null;
  first_name?: string | null;
  last_name?: string | null;
  department?: string | null;
  year?: number | null;
  hostel?: string | null;
};

export default function OnboardingIndexPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await fetch("/api/users/me", { method: "GET" });
        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as { profile?: Profile | null };
        const profile = payload.profile ?? null;

        if (!profile?.phone) {
          router.replace("/verify-whatsapp");
          return;
        }

        if (!profile.trust_explainer_seen) {
          router.replace("/onboarding/trust-explainer");
          return;
        }

        if (!profile.alias) {
          router.replace("/onboarding/alias");
          return;
        }

        const profileComplete =
          Boolean(profile.first_name) &&
          Boolean(profile.last_name) &&
          Boolean(profile.department) &&
          Boolean(profile.year) &&
          Boolean(profile.hostel);

        if (!profileComplete) {
          router.replace("/onboarding/profile-setup");
          return;
        }

        router.replace("/home");
      } finally {
        setLoading(false);
      }
    };

    if (pathname === "/onboarding") {
      run();
    }
  }, [pathname, router]);

  if (!loading) {
    return null;
  }

  return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
    </main>
  );
}

