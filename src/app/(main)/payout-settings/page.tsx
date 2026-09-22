"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";

export default function PayoutSettings() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select(
          "upi_id, bank_account_number, bank_ifsc, bank_account_name"
        )
        .eq("id", user.id)
        .single();

      if (data) {
        if (data.upi_id) {
          setMethod("upi");
          setUpiId(data.upi_id);
        } else if (data.bank_account_number) {
          setMethod("bank");
          setAccountNumber(data.bank_account_number);
          setIfsc(data.bank_ifsc ?? "");
          setAccountName(data.bank_account_name ?? "");
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (method === "upi") {
      await supabase
        .from("users")
        .update({
          upi_id: upiId,
          bank_account_number: null,
          bank_ifsc: null,
          bank_account_name: null,
        })
        .eq("id", user.id);
    } else {
      await supabase
        .from("users")
        .update({
          upi_id: null,
          bank_account_number: accountNumber,
          bank_ifsc: ifsc,
          bank_account_name: accountName,
        })
        .eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);

    setTimeout(() => setSaved(false), 2000);
  };

  const isValid =
    method === "upi"
      ? upiId.includes("@")
      : accountName &&
        accountNumber.length >= 9 &&
        ifsc.length === 11;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
        <header className="border-b border-[#292929]">
          <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-5 md:px-8">
            <div className="h-2 w-12 animate-pulse rounded bg-[#292929]" />
            <div className="h-2 w-28 animate-pulse rounded bg-[#292929]" />
          </div>
        </header>

        <div className="mx-auto max-w-lg px-4 pt-8 md:px-8">
          <div className="mb-2 h-5 w-40 animate-pulse rounded bg-[#292929]" />
          <div className="mb-8 h-3 w-56 animate-pulse rounded bg-[#292929]" />

          <div className="mb-6 h-20 w-full animate-pulse rounded-xl bg-[#292929]" />
          <div className="mb-4 h-10 w-full animate-pulse rounded-xl bg-[#292929]" />
          <div className="mb-3 h-12 w-full animate-pulse rounded-xl bg-[#292929]" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-[#292929]" />
        </div>

        <BottomNav />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] pb-24 text-[#F5F5F5]">
      {/* Header */}
      <header className="border-b border-[#292929]">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-5 md:px-8">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#686D72] transition-colors duration-200 hover:text-[#E5FF00]"
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

          <span className="text-[10px] uppercase tracking-[0.25em] text-[#686D72]">
            DRENZ / PAYOUT
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-8 md:px-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            PAYOUT SETTINGS
          </h1>

          <p className="mt-1 text-sm text-[#969696]">
            Manage where your completed-sale payments are sent.
          </p>
        </div>

        {/* Info banner */}
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-[#E5FF00]/15 bg-[#E5FF00]/[0.04] p-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E5FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E5FF00]">
              How Payouts Work
            </p>

            <p className="text-[12px] leading-relaxed text-[#BFC3C7]">
              After a successful meetup and handoff code confirmation, your
              payment is automatically sent to your UPI or bank account within
              2 business days.
            </p>
          </div>
        </div>

        {/* Method selector */}
        <div className="mb-6">
          <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
            Payout Method
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("upi")}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 ${
                method === "upi"
                  ? "bg-[#E5FF00] text-[#080808]"
                  : "border border-[#292929] bg-[#151515] text-[#686D72] hover:border-[#686D72]/30 hover:text-[#BFC3C7]"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>

              UPI
            </button>

            <button
              onClick={() => setMethod("bank")}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 ${
                method === "bank"
                  ? "bg-[#E5FF00] text-[#080808]"
                  : "border border-[#292929] bg-[#151515] text-[#686D72] hover:border-[#686D72]/30 hover:text-[#BFC3C7]"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>

              Bank Account
            </button>
          </div>
        </div>

        {/* UPI form */}
        {method === "upi" && (
          <div className="mb-6">
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
              UPI ID
            </label>

            <input
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full rounded-xl border border-[#292929] bg-[#111111] px-4 py-3 text-[13px] text-[#F5F5F5] outline-none transition-colors duration-200 placeholder:text-[#686D72] focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
            />
          </div>
        )}

        {/* Bank form */}
        {method === "bank" && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                Account Holder Name
              </label>

              <input
                type="text"
                placeholder="As per bank records"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full rounded-xl border border-[#292929] bg-[#111111] px-4 py-3 text-[13px] text-[#F5F5F5] outline-none transition-colors duration-200 placeholder:text-[#686D72] focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                Account Number
              </label>

              <input
                type="text"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-[#292929] bg-[#111111] px-4 py-3 text-[13px] text-[#F5F5F5] outline-none transition-colors duration-200 placeholder:text-[#686D72] focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#686D72]">
                IFSC Code
              </label>

              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={ifsc}
                onChange={(e) =>
                  setIfsc(e.target.value.toUpperCase())
                }
                maxLength={11}
                className="w-full rounded-xl border border-[#292929] bg-[#111111] px-4 py-3 text-[13px] text-[#F5F5F5] outline-none transition-colors duration-200 placeholder:text-[#686D72] focus:border-[#E5FF00]/30 focus:shadow-[0_0_0_3px_rgba(229,255,0,0.05)]"
              />
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={`group flex h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-semibold tracking-[0.1em] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none ${
            saved
              ? "bg-[#E5FF00] text-[#080808] shadow-[0_0_28px_rgba(229,255,0,0.15)]"
              : isValid
                ? "bg-[#E5FF00] text-[#080808] hover:-translate-y-0.5 hover:bg-[#F2FF4A] hover:shadow-[0_0_28px_rgba(229,255,0,0.3)]"
                : "bg-[#292929] text-[#686D72]"
          }`}
        >
          {saved ? (
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              SAVED
            </span>
          ) : saving ? (
            <span className="flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="animate-spin"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              SAVING
            </span>
          ) : (
            "SAVE PAYOUT DETAILS"
          )}
        </button>

        {/* Security note */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#686D72"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>

          <p className="text-[10px] tracking-wide text-[#686D72]">
            Your payout details are encrypted and stored securely.
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}