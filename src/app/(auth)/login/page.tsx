"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-brand-yellow font-black text-4xl tracking-widest uppercase">
          DRENZ
        </h1>
        <p className="text-white/50 text-sm mt-2">Campus fashion. Safely traded.</p>
      </div>

      {/* Card */}
      <div className="bg-brand-card border border-white/10 rounded-3xl p-8 w-full max-w-sm">
        <h2 className="text-white font-bold text-lg mb-1">Sign in</h2>
        <p className="text-white/50 text-sm mb-6">
          Use your{" "}
          <span className="text-brand-ticker font-semibold">@kiit.ac.in</span>{" "}
          Google account to continue.
        </p>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black font-semibold text-sm rounded-2xl py-4 flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? "Connecting…" : "Continue with Google"}
        </button>

        {/* Error state */}
        {error && (
          <div className="mt-4 bg-red-950 border border-red-800 rounded-2xl p-4">
            <p className="text-red-400 text-xs font-bold mb-1">⛔ Sign in failed</p>
            <p className="text-red-300 text-xs leading-relaxed">{error}</p>
          </div>
        )}

        {/* Domain notice */}
        <div className="mt-4 bg-green-950 border border-green-800 rounded-2xl p-4">
          <p className="text-green-400 text-xs font-bold mb-1">✅ KIIT students only</p>
          <p className="text-green-300 text-xs leading-relaxed">
            Only <strong>@kiit.ac.in</strong> accounts are accepted. Personal Gmail will be rejected.
          </p>
        </div>
      </div>

      <p className="text-white/30 text-xs text-center mt-6 leading-relaxed">
        By continuing you agree to our Terms.<br />No outsiders. No personal Gmail.
      </p>
    </main>
  );
}
