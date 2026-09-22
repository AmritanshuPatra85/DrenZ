"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, UserRoundX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CARDS = [
  {
    title: "Your identity stays hidden",
    subtext: "You browse and chat as your alias only.",
    Icon: UserRoundX,
  },
  {
    title: "Payment unlocks who you're dealing with",
    subtext: "Identity is revealed only after payment.",
    Icon: CreditCard,
  },
  {
    title: "Your money is held safely",
    subtext: "Funds release only when handoff code is confirmed.",
    Icon: ShieldCheck,
  },
];

export default function TrustExplainerPage() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const nextIndex = Math.round(container.scrollLeft / container.clientWidth);
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
    }
  };

  const handleSeenAndExit = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trust_explainer_seen: true }),
      });
    } finally {
      router.replace("/");
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-6 text-[#F5F5F5] sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / TRUST
          </p>
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-2 py-1 text-[#686D72] text-[11px] tracking-[0.12em] uppercase hover:bg-transparent hover:text-[#E5FF00] transition-colors duration-200"
            onClick={handleSeenAndExit}
            disabled={isSaving}
          >
            Skip
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight leading-tight">
            HOW DRENZ<br className="sm:hidden" /> KEEPS YOU SAFE
          </h1>
          <p className="mt-1 text-sm text-[#969696]">
            Three simple rules behind every exchange.
          </p>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {CARDS.map((card, index) => {
            const isLast = index === CARDS.length - 1;
            const Icon = card.Icon;

            return (
              <div key={card.title} className="w-full shrink-0 snap-start">
                <Card className="min-h-[55vh] bg-[#111111] text-[#F5F5F5] border border-[#292929] rounded-xl">
                  <CardContent className="flex h-full flex-col items-center justify-center px-6 py-10 text-center sm:px-8">
                    <p className="mb-6 text-[11px] font-semibold tracking-[0.22em] text-[#686D72]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <Icon className="mb-6 h-14 w-14 text-[#E5FF00] opacity-90" strokeWidth={1.5} />
                    <h2 className="text-lg font-bold leading-tight tracking-tight">
                      {card.title}
                    </h2>
                    <p className="mt-3 text-sm text-[#BFC3C7] leading-relaxed">
                      {card.subtext}
                    </p>

                    {isLast && (
                      <Button
                        type="button"
                        onClick={handleSeenAndExit}
                        disabled={isSaving}
                        className="mt-10 h-11 w-full max-w-xs bg-[#E5FF00] text-[#080808] font-semibold tracking-[0.08em] text-xs hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] transition-all duration-200"
                      >
                        Got it
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {CARDS.map((card, index) => (
            <span
              key={card.title}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? "w-6 bg-[#E5FF00]"
                  : "w-1.5 bg-[#686D72]/40"
              }`}
            />
          ))}
        </div>

        <p className="mt-3 text-center text-[10px] text-[#686D72] tracking-[0.16em] uppercase">
          {String(currentIndex + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}
        </p>
      </div>
    </main>
  );
}