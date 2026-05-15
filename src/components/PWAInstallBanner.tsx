// src/components/PWAInstallBanner.tsx
"use client";

import { useEffect, useState } from "react";

export default function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("pwa-dismissed")) return;

    // Detect iOS
    const isIOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as any).standalone;

    if (isIOS) {
      setShowIOS(true);
      return;
    }

    // Android/Chrome install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setPrompt(e);
      setShowAndroid(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setShowAndroid(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setShowAndroid(false);
    setShowIOS(false);
  };

  // Android Banner
  if (showAndroid) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-brand-yellow text-black rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📲</span>
          <div>
            <p className="font-black text-sm">Install DrenZ App</p>
            <p className="text-xs opacity-70">Shop campus fashion on the go</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="text-xs px-3 py-1.5 rounded-full bg-black/10 font-semibold"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="text-xs px-3 py-1.5 rounded-full bg-black text-white font-semibold"
          >
            Install
          </button>
        </div>
      </div>
    );
  }

  // iOS Banner
  if (showIOS) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-brand-yellow text-black rounded-2xl p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📲</span>
            <div>
              <p className="font-black text-sm">Install DrenZ App</p>
              <p className="text-xs opacity-70 mt-0.5 leading-relaxed">
                Tap the <span className="font-bold">Share</span> button{" "}
                <span className="text-base">⎋</span> at the bottom of Safari,
                then tap{" "}
                <span className="font-bold">"Add to Home Screen"</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-lg leading-none opacity-50 shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
}