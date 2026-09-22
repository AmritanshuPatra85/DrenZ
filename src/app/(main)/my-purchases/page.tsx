"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

const TABS = ["Active", "Completed", "Disputed"];

const FALLBACK = {
  Active: [
    {
      id: "1",
      listing_title: "H&M Oversized Hoodie",
      price: 349,
      seller_alias: "cool_tiger",
      expires_at: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      handoff_code: "7842",
      code_revealed: false,
    },
  ],
  Completed: [
    {
      id: "2",
      listing_title: "Levi's 511 Jeans",
      price: 599,
      seller_alias: "lazy_fox",
      completed_at: new Date(
        Date.now() - 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      rated: false,
    },
  ],
  Disputed: [
    {
      id: "3",
      listing_title: "Nike Tanjun Sneakers",
      price: 799,
      seller_alias: "bold_lynx",
      dispute_status: "open",
      dispute_category: "item_not_as_described",
    },
  ],
};

export default function MyPurchases() {
  const [tab, setTab] = useState("Active");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const statusMap: Record<string, string> = {
        Active: "reserved",
        Completed: "completed",
        Disputed: "disputed",
      };

      const { data } = await supabase
        .from("transactions")
        .select(
          "id, status, handoff_code_display, expires_at, completed_at, listing:listings(title, price), seller:users!seller_id(alias)"
        )
        .eq("buyer_id", user.id)
        .eq("status", statusMap[tab]);

      setTransactions(
        data && data.length > 0
          ? data.map((t: any) => ({
              ...t,
              listing_title: t.listing?.title,
              price: t.listing?.price,
              seller_alias: t.seller?.alias,
            }))
          : FALLBACK[tab as keyof typeof FALLBACK] ?? []
      );

      setLoading(false);
    };

    fetch();
  }, [tab]);

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5] pb-24">
      {/* Header */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-3xl flex items-center justify-between px-4 py-5 md:px-8">
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
            DRENZ / TRANSACTIONS
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-8 md:px-8">
        {/* Title */}
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight mb-6">
          MY PURCHASES
        </h1>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-[#292929] mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex-1 pb-3 pt-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors duration-200 ${
                tab === t
                  ? "text-[#E5FF00]"
                  : "text-[#686D72] hover:text-[#BFC3C7]"
              }`}
            >
              {t}

              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-[#E5FF00]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          /* Skeleton */
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#111111] border border-[#292929] rounded-xl p-4 animate-pulse"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="h-3.5 w-36 bg-[#292929] rounded" />
                    <div className="h-3 w-14 bg-[#292929] rounded" />
                  </div>

                  <div className="h-2.5 w-24 bg-[#292929] rounded" />
                </div>

                <div className="h-14 w-full bg-[#292929] rounded-lg" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#686D72"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-25 mb-5"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>

            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
              NO PURCHASES YET
            </p>

            <p className="text-sm text-[#969696]">
              No {tab.toLowerCase()} purchases
            </p>

            <Link
              href="/home"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E5FF00] hover:text-[#F2FF4A] transition-colors duration-200"
            >
              Browse listings
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
            </Link>
          </div>
        ) : (
          /* Transaction cards */
          <div className="space-y-3">
            {transactions.map((t: any) => (
              <div
                key={t.id}
                className="bg-[#111111] border border-[#292929] rounded-xl p-4 transition-all duration-200 hover:border-[#686D72]/30"
              >
                {/* Title + price */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#F5F5F5] truncate">
                      {t.listing_title}
                    </p>

                    <p className="text-[11px] text-[#686D72] mt-0.5">
                      @{t.seller_alias}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-[#E5FF00] shrink-0">
                    ₹{t.price}
                  </p>
                </div>

                {/* Active: handoff code + expiry + meetup */}
                {tab === "Active" && (
                  <div className="space-y-3">
                    {/* Handoff code */}
                    <div className="bg-[#080808] border border-[#292929] rounded-lg p-4 text-center">
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-3">
                        HANDOFF CODE
                      </p>

                      {revealed[t.id] ? (
                        <p className="font-mono text-3xl font-black tracking-[0.35em] text-[#E5FF00]">
                          {t.handoff_code ??
                            t.handoff_code_display ??
                            "7842"}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setRevealed((prev) => ({
                              ...prev,
                              [t.id]: true,
                            }))
                          }
                          className="font-mono text-3xl font-black tracking-[0.35em] text-[#686D72] hover:text-[#BFC3C7] transition-colors duration-200"
                        >
                          ● ● ● ●
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setRevealed((prev) => ({
                            ...prev,
                            [t.id]: !prev[t.id],
                          }))
                        }
                        className="mt-2 text-[10px] text-[#686D72] hover:text-[#969696] transition-colors duration-200 tracking-wide"
                      >
                        tap to {revealed[t.id] ? "hide" : "reveal"}
                      </button>
                    </div>

                    {/* Expiry */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#686D72] tracking-wide uppercase">
                        Meetup window
                      </span>

                      <span className="text-[#E5FF00] font-semibold">
                        {new Date(t.expires_at).toLocaleString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/meetup/${t.id}`}
                      className="group flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
                    >
                      GO TO MEETUP

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
                    </Link>
                  </div>
                )}

                {/* Completed */}
                {tab === "Completed" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#686D72] tracking-wide uppercase">
                        Completed
                      </span>

                      <span className="text-[#BFC3C7]">
                        {new Date(t.completed_at).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>

                    {!t.rated && (
                      <Link
                        href={`/rating/${t.id}`}
                        className="group flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#E5FF00] text-[#080808] text-xs font-semibold tracking-[0.08em] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)] active:scale-[0.98]"
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
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        RATE SELLER
                      </Link>
                    )}

                    {t.rated && (
                      <div className="flex items-center justify-center gap-1.5 py-2">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#969696"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>

                        <span className="text-[11px] font-semibold text-[#969696] tracking-wide uppercase">
                          Rated
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Disputed */}
                {tab === "Disputed" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${
                          t.dispute_status === "open"
                            ? "bg-[#3a2a10] text-[#F2A340]"
                            : t.dispute_status === "resolved"
                              ? "bg-[#102a1a] text-[#4ade80]"
                              : "bg-[#2a1215] text-[#e55555]"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {t.dispute_status?.toUpperCase() ?? "OPEN"}
                      </span>

                      <span className="text-[11px] text-[#686D72]">
                        {t.dispute_category?.replace(/_/g, " ")}
                      </span>
                    </div>

                    <Link
                      href={`/dispute/${t.id}`}
                      className="group flex items-center justify-center gap-2 w-full h-10 rounded-xl bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.08em] transition-all duration-200 hover:border-[#BFC3C7]/20 hover:text-[#F5F5F5]"
                    >
                      VIEW DISPUTE

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
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}