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
    <main className="min-h-screen bg-brand-dark px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <div className="mb-5 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-2 py-1 text-brand-yellow hover:bg-transparent hover:text-brand-yellow/80"
            onClick={handleSeenAndExit}
            disabled={isSaving}
          >
            Skip
          </Button>
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
                <Card className="min-h-[72vh] bg-brand-card text-white ring-1 ring-white/10">
                  <CardContent className="flex h-full flex-col items-center justify-center px-6 py-10 text-center sm:px-8">
                    <Icon className="mb-7 h-16 w-16 text-brand-yellow" strokeWidth={2} />
                    <h2 className="text-2xl font-bold leading-tight">{card.title}</h2>
                    <p className="mt-3 text-sm text-white/80">{card.subtext}</p>

                    {isLast && (
                      <Button
                        type="button"
                        onClick={handleSeenAndExit}
                        disabled={isSaving}
                        className="mt-10 h-10 w-full max-w-xs bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
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
              className={`h-2.5 w-2.5 rounded-full ${
                index === currentIndex ? "bg-brand-yellow" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
