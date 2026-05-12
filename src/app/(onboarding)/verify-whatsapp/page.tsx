"use client";

import Link from "next/link";
import { ClipboardEvent, FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const OTP_LENGTH = 6;

function rateLimitMessage() {
  return "You have reached the OTP limit (3 requests per hour). Please try again in about an hour.";
}

export default function VerifyWhatsappPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const normalizedPhone = useMemo(() => phone.replace(/\D/g, "").slice(0, 10), [phone]);
  const otpValue = useMemo(() => otp.join(""), [otp]);

  const handleSendOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (normalizedPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/auth/verify-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          setError(rateLimitMessage());
          return;
        }

        const fallback = "We could not send your OTP right now. Please try again.";
        setError(typeof payload.error === "string" ? payload.error : fallback);
        return;
      }

      setOtpSent(true);
      setVerified(false);
      setOtp(Array(OTP_LENGTH).fill(""));
      setSuccessMessage("OTP sent. Enter the 6-digit code from WhatsApp.");
      setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch {
      setError("Network issue detected. Please check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  };

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

      setVerified(true);
      setSuccessMessage("WhatsApp number verified successfully.");
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
            <h1 className="text-2xl font-semibold tracking-tight">Verify WhatsApp</h1>
            <p className="mt-2 text-sm text-white/75">We will send a one-time password to your WhatsApp number.</p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="h-auto px-0 py-0 text-brand-yellow hover:bg-transparent hover:text-brand-yellow/80"
          >
            <Link href="/">Skip</Link>
          </Button>
        </div>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <label htmlFor="phone" className="block text-sm font-medium text-white">
            Phone number
          </label>
          <div className="flex items-center gap-2">
            <span className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm font-medium text-white/90">
              +91
            </span>
            <Input
              id="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={normalizedPhone}
              onChange={(event) => {
                setPhone(event.target.value);
                setError(null);
              }}
              placeholder="9876543210"
              className="h-10 border-white/20 text-white placeholder:text-white/40"
              disabled={isSending || isVerifying || verified}
            />
          </div>

          <Button
            type="submit"
            className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
            disabled={isSending || isVerifying || normalizedPhone.length !== 10 || verified}
          >
            {isSending ? "Sending OTP..." : otpSent ? "Resend OTP" : "Send OTP"}
          </Button>
        </form>

        {otpSent && (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-white">Enter OTP</p>
              <p className="mt-1 text-xs text-white/65">Enter the 6-digit code we sent to +91 {normalizedPhone}</p>
            </div>

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
                  disabled={isVerifying || verified}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90"
              disabled={isVerifying || otpValue.length !== OTP_LENGTH || verified}
            >
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        )}

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

        {verified && (
          <div className="mt-5 rounded-lg border border-brand-yellow/60 bg-brand-yellow/10 p-4">
            <p className="text-sm font-semibold text-brand-yellow">Verification complete</p>
            <p className="mt-1 text-sm text-white/80">Your WhatsApp number is now linked to your account.</p>
            <Button asChild className="mt-4 h-10 w-full bg-brand-yellow font-semibold text-brand-dark hover:bg-brand-yellow/90">
              <Link href="/">Continue</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
