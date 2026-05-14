"use client";

import Link from "next/link";
import { ClipboardEvent, FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OTP_LENGTH = 6;

export default function ConfirmOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedPhone = useMemo(() => phoneParam.replace(/\D/g, "").slice(0, 10), [phoneParam]);
  const otpValue = useMemo(() => otp.join(""), [otp]);

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) {
      return;
    }

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      const updatedOtp = [...otp];
      updatedOtp[index - 1] = "";
      setOtp(updatedOtp);
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!pasted) {
      return;
    }

    const next = Array(OTP_LENGTH).fill("") as string[];

    for (let index = 0; index < pasted.length; index += 1) {
      next[index] = pasted[index];
    }

    setOtp(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (normalizedPhone.length !== 10) {
      setError("Missing phone number. Go back and request a new OTP.");
      return;
    }

    if (otpValue.length !== OTP_LENGTH) {
      setError("Enter all 6 digits from your OTP.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/confirm-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, otp: otpValue }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const fallback = "We could not verify your OTP. Please try again.";
        setError(typeof payload.error === "string" ? payload.error : fallback);
        return;
      }

      setSuccessMessage("WhatsApp number verified successfully.");
      router.replace("/onboarding");
    } catch {
      setError("Network issue detected. Please check your connection and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark px-4 py-8 text-white sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-brand-card p-6 shadow-lg ring-1 ring-white/10 sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Confirm OTP</h1>
            <p className="mt-2 text-sm text-white/75">Enter the 6-digit code we sent to +91 {normalizedPhone}.</p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="h-auto px-0 py-0 text-brand-yellow hover:bg-transparent hover:text-brand-yellow/80"
          >
            <Link href="/verify-whatsapp">Change</Link>
          </Button>
        </div>

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="grid grid-cols-6 gap-2 sm:gap-3">
            {otp.map((digit, index) => (
              <Input
                key={`otp-${index}`}
                ref={(element) => {
                  otpRefs.current[index] = element;
                }}
                value={digit}
                onChange={(event) => {
                  handleOtpChange(event.target.value, index);
                  setError(null);
                }}
                onKeyDown={(event) => handleOtpKeyDown(event, index)}
                onPaste={handleOtpPaste}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                className="h-12 text-center text-lg tracking-wide text-white"
                disabled={isVerifying}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          <Button
            type="submit"
            className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
            disabled={isVerifying || otpValue.length !== OTP_LENGTH}
          >
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>

        {error && (
          <div className="mt-5 rounded-lg border border-red-400/50 bg-red-500/15 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-lg border border-brand-yellow/50 bg-brand-yellow/15 px-3 py-2 text-sm text-white">
            {successMessage}
          </div>
        )}
      </div>
    </main>
  );
}

