"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateAliases } from "@/lib/alias-generator";

const MAX_REGENERATE_USES = 5;

export default function AliasPickerPage() {
  const router = useRouter();
  const [aliases, setAliases] = useState<string[]>(() => generateAliases());
  const [selectedAlias, setSelectedAlias] = useState<string | null>(null);
  const [regenerateUses, setRegenerateUses] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const regenerateDisabled = useMemo(
    () => regenerateUses >= MAX_REGENERATE_USES || isSaving,
    [regenerateUses, isSaving]
  );

  const handleRegenerate = () => {
    if (regenerateUses >= MAX_REGENERATE_USES) return;
    setAliases(generateAliases());
    setSelectedAlias(null);
    setRegenerateUses((previous) => previous + 1);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleConfirm = async () => {
    if (!selectedAlias) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: selectedAlias }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallback = "We could not save your alias. Please try again.";
        setErrorMessage(typeof payload.error === "string" ? payload.error : fallback);
        return;
      }

      setSuccessMessage(`Alias locked in: ${selectedAlias}`);
      setTimeout(() => router.push("/home"), 1000);
    } catch {
      setErrorMessage("Network issue detected. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#F5F5F5]">
      <header className="border-b border-[#292929]">
        <div className="mx-auto max-w-md px-4 py-5 sm:px-6">
          <p className="text-[10px] tracking-[0.25em] text-[#686D72] uppercase">
            DRENZ / IDENTITY
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight leading-tight">
            CHOOSE<br className="sm:hidden" /> YOUR ALIAS
          </h1>
          <p className="mt-1 text-sm text-[#969696]">
            Choose how you appear on the campus marketplace.
          </p>
        </div>

        {/* Regenerate */}
        <div className="mb-6">
          <Button
            type="button"
            onClick={handleRegenerate}
            disabled={regenerateDisabled}
            className="h-9 w-full bg-[#151515] border border-[#292929] text-[#BFC3C7] text-xs font-semibold tracking-[0.06em] uppercase hover:border-[#686D72]/30 hover:text-[#F5F5F5] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" strokeWidth={1.5} />
            {regenerateDisabled
              ? "Regenerate Limit Reached"
              : `Regenerate (${regenerateUses}/${MAX_REGENERATE_USES})`}
          </Button>
        </div>

        {/* Alias list */}
        <div className="space-y-2 mb-6">
          {aliases.map((alias) => {
            const selected = alias === selectedAlias;
            return (
              <button
                key={alias}
                type="button"
                onClick={() => {
                  setSelectedAlias(alias);
                  setErrorMessage(null);
                }}
                className={`w-full rounded-xl border px-4 py-4 text-left transition-all duration-200 ${
                  selected
                    ? "border-[#E5FF00] bg-[#E5FF00]/[0.04]"
                    : "border-[#292929] bg-[#111111] hover:border-[#686D72]/30 hover:-translate-y-px"
                }`}
              >
                <p className="text-base font-semibold tracking-tight">@{alias}</p>
              </button>
            );
          })}
        </div>

        {/* Selected alias confirmation */}
        {selectedAlias && (
          <div className="mb-6 rounded-xl border border-[#E5FF00]/20 bg-[#E5FF00]/[0.04] p-4">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[#686D72] uppercase mb-2">
              Selected Identity
            </p>
            <p className="text-lg font-bold tracking-tight text-[#E5FF00] mb-2">
              @{selectedAlias}
            </p>
            <p className="text-xs text-[#BFC3C7] leading-relaxed mb-4">
              Your alias becomes permanent after 7 days.
            </p>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              className="h-11 w-full bg-[#E5FF00] text-[#080808] font-semibold tracking-[0.08em] text-sm hover:bg-[#F2FF4A] transition-colors duration-200"
            >
              {isSaving ? "Saving Alias..." : "Confirm Alias"}
            </Button>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-[#3d1a1a] bg-[#2a1215] px-3 py-2 text-sm text-[#e55555]">
            {errorMessage}
          </div>
        )}

        {/* Success */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-[#E5FF00]/20 bg-[#E5FF00]/[0.04] px-3 py-2 text-sm text-[#E5FF00]">
            {successMessage}
          </div>
        )}
      </div>
    </main>
  );
}