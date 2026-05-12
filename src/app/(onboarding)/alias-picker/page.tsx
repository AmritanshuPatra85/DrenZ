"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAliases } from "@/lib/alias-generator";

const MAX_REGENERATE_USES = 5;

export default function AliasPickerPage() {
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
    if (regenerateUses >= MAX_REGENERATE_USES) {
      return;
    }

    setAliases(generateAliases());
    setSelectedAlias(null);
    setRegenerateUses((previous) => previous + 1);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleConfirm = async () => {
    if (!selectedAlias) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alias: selectedAlias }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallback = "We could not save your alias. Please try again.";
        setErrorMessage(typeof payload.error === "string" ? payload.error : fallback);
        return;
      }

      setSuccessMessage(`Alias locked in: ${selectedAlias}`);
    } catch {
      setErrorMessage("Network issue detected. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <Card className="bg-brand-card text-white ring-1 ring-white/10">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl tracking-tight">Pick Your Alias</CardTitle>
            <p className="text-sm text-white/75">
              Choose how you appear on campus marketplace listings.
            </p>
            <Button
              type="button"
              onClick={handleRegenerate}
              disabled={regenerateDisabled}
              className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
            >
              {regenerateDisabled
                ? "Regenerate Limit Reached"
                : `Regenerate (${regenerateUses}/${MAX_REGENERATE_USES})`}
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
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
                  className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-brand-yellow bg-brand-card ring-1 ring-brand-yellow/40"
                      : "border-white/15 bg-brand-card hover:border-white/35"
                  }`}
                >
                  <p className="text-base font-semibold">{alias}</p>
                </button>
              );
            })}

            {selectedAlias && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-brand-yellow">
                  Your alias becomes permanent after 7 days.
                </p>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
                >
                  {isSaving ? "Saving Alias..." : "Confirm Alias"}
                </Button>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-lg border border-brand-yellow/50 bg-brand-yellow/15 px-3 py-2 text-sm text-white">
                {successMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
