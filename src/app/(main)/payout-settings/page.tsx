"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import BottomNav from "@/components/BottomNav";

export default function PayoutSettings() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [method, setMethod]     = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId]       = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc]         = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("users")
        .select("upi_id, bank_account_number, bank_ifsc, bank_account_name")
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (method === "upi") {
      await supabase.from("users").update({
        upi_id: upiId,
        bank_account_number: null,
        bank_ifsc: null,
        bank_account_name: null,
      }).eq("id", user.id);
    } else {
      await supabase.from("users").update({
        upi_id: null,
        bank_account_number: accountNumber,
        bank_ifsc: ifsc,
        bank_account_name: accountName,
      }).eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isValid = method === "upi"
    ? upiId.includes("@")
    : accountName && accountNumber.length >= 9 && ifsc.length === 11;

  if (loading) return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-white/30 text-sm">Loading…</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-brand-dark text-white pb-24">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white/50 text-sm">← Back</button>
        <h1 className="text-white font-bold text-lg flex-1 text-center">Payout Settings</h1>
        <div className="w-12" />
      </div>

      <div className="px-4 space-y-4">

        {/* Info banner */}
        <div className="bg-green-950/50 border border-green-800/30 rounded-2xl px-4 py-3">
          <p className="text-green-400 text-xs font-bold mb-1">💰 How payouts work</p>
          <p className="text-white/50 text-xs">After a successful meetup and handoff code confirmation, your payment is automatically sent to your UPI or bank account within 2 business days.</p>
        </div>

        {/* Method selector */}
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Payout Method</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("upi")}
              className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                method === "upi" ? "bg-brand-yellow text-black" : "bg-brand-card border border-white/10 text-white/60"
              }`}
            >
              📱 UPI
            </button>
            <button
              onClick={() => setMethod("bank")}
              className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                method === "bank" ? "bg-brand-yellow text-black" : "bg-brand-card border border-white/10 text-white/60"
              }`}
            >
              🏦 Bank Account
            </button>
          </div>
        </div>

        {/* UPI */}
        {method === "upi" && (
          <div>
            <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">UPI ID</label>
            <input
              type="text"
              placeholder="yourname@upi"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
              className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
            />
          </div>
        )}

        {/* Bank */}
        {method === "bank" && (
          <div className="space-y-3">
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Account Holder Name</label>
              <input
                type="text"
                placeholder="As per bank records"
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">Account Number</label>
              <input
                type="text"
                placeholder="Enter account number"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2 block">IFSC Code</label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={ifsc}
                onChange={e => setIfsc(e.target.value.toUpperCase())}
                maxLength={11}
                className="w-full bg-brand-card border border-white/10 rounded-2xl px-4 py-3 text-white text-sm placeholder-white/30 outline-none focus:border-brand-yellow/50"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!isValid || saving}
          className={`w-full font-bold py-4 rounded-2xl text-sm transition-colors ${
            saved ? "bg-green-500 text-white" :
            isValid ? "bg-brand-yellow text-black" : "bg-white/10 text-white/30"
          } disabled:opacity-50`}
        >
          {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Payout Details"}
        </button>

        <p className="text-white/20 text-xs text-center">
          Your payout details are encrypted and stored securely.
        </p>
      </div>

      <BottomNav />
    </main>
  );
}