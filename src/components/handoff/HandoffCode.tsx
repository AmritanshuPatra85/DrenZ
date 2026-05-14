"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { Input } from "@/components/ui/input"

type HandoffCodeProps = {
  role: "buyer" | "seller"
  code?: string
  onSubmit?: (code: string) => void
  isCorrect?: boolean
  isError?: boolean
  isLocked?: boolean
  attemptsRemaining?: number
}

const CODE_LENGTH = 4

const toDigits = (value?: string) => {
  const clean = (value ?? "").replace(/\D/g, "").slice(0, CODE_LENGTH)
  return clean.padEnd(CODE_LENGTH, "-").split("")
}

export default function HandoffCode({
  role,
  code,
  onSubmit,
  isCorrect = false,
  isError = false,
  isLocked = false,
  attemptsRemaining,
}: HandoffCodeProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""])
  const [copied, setCopied] = useState(false)
  const [copyFlash, setCopyFlash] = useState(false)
  const [errorPulse, setErrorPulse] = useState(false)
  const [successPulse, setSuccessPulse] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSubmittedRef = useRef<string | null>(null)

  const buyerDigits = useMemo(() => toDigits(code), [code])

  useEffect(() => {
    if (!isCorrect) {
      return
    }
    setSuccessPulse(true)
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current)
    }
    pulseTimerRef.current = setTimeout(() => setSuccessPulse(false), 420)
  }, [isCorrect])

  useEffect(() => {
    if (!isError) {
      return
    }
    setErrorPulse(true)
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current)
    }
    pulseTimerRef.current = setTimeout(() => setErrorPulse(false), 420)
  }, [isError])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      if (pulseTimerRef.current) {
        clearTimeout(pulseTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (role !== "seller" || isLocked) {
      return
    }
    inputRefs.current[0]?.focus()
  }, [role, isLocked])

  useEffect(() => {
    if (role !== "seller" || !onSubmit || isLocked) {
      return
    }

    const joined = digits.join("")
    const complete = /^\d{4}$/.test(joined)
    if (!complete) {
      lastSubmittedRef.current = null
      return
    }

    if (lastSubmittedRef.current === joined) {
      return
    }

    lastSubmittedRef.current = joined
    onSubmit(joined)
  }, [digits, isLocked, onSubmit, role])

  const handleCopy = async () => {
    if (role !== "buyer" || !code) {
      return
    }

    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setCopyFlash(true)
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false)
        setCopyFlash(false)
      }, 2000)
    } catch {
      // Clipboard can fail due to browser permissions; keep UI stable.
    }
  }

  const handleDigitChange = (index: number, value: string) => {
    if (isLocked) {
      return
    }

    const nextDigit = value.replace(/\D/g, "").slice(-1)
    setDigits((previous) => {
      const next = [...previous]
      next[index] = nextDigit
      return next
    })

    if (nextDigit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (isLocked) {
      return
    }
    event.preventDefault()
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH)
      .split("")

    if (pasted.length === 0) {
      return
    }

    setDigits((previous) => {
      const next = [...previous]
      for (let index = 0; index < CODE_LENGTH; index += 1) {
        next[index] = pasted[index] ?? ""
      }
      return next
    })

    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  if (role === "buyer") {
    return (
      <div
        className={`rounded-2xl border bg-brand-card p-4 text-white transition ${
          copyFlash ? "border-green-400 copy-flash" : "border-white/10"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Handoff Code</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 w-full rounded-xl border border-white/10 bg-brand-dark px-4 py-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow/30"
        >
          <p className="font-mono text-4xl font-black tracking-[0.35em] text-brand-yellow sm:text-5xl">
            {buyerDigits.join(" ")}
          </p>
          <p className="mt-2 text-xs text-white/60">{copied ? "Copied!" : "Tap to copy"}</p>
        </button>

        <style jsx>{`
          .copy-flash {
            animation: successFlash 420ms ease-out;
          }

          @keyframes successFlash {
            0% {
              box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5);
            }
            100% {
              box-shadow: 0 0 0 12px rgba(74, 222, 128, 0);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border bg-brand-card p-4 text-white transition ${
        isLocked
          ? "border-white/10 opacity-65"
          : successPulse
            ? "border-green-400 success-flash"
            : errorPulse
              ? "border-red-400 error-shake"
              : "border-white/10"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Enter Handoff Code</p>

      <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <Input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element
            }}
            value={digit}
            onChange={(event) => handleDigitChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={isLocked}
            className={`h-14 w-12 rounded-xl border bg-brand-dark px-0 text-center font-mono text-2xl font-bold text-brand-yellow sm:w-14 ${
              isLocked
                ? "border-white/10 text-white/40"
                : "border-white/20 focus-visible:border-brand-yellow focus-visible:ring-brand-yellow/30"
            }`}
          />
        ))}
      </div>

      {isLocked ? (
        <p className="mt-3 text-center text-sm font-semibold text-white/70">Too many attempts</p>
      ) : isError ? (
        <p className="mt-3 text-center text-sm text-red-300">
          {typeof attemptsRemaining === "number"
            ? `${attemptsRemaining} attempts remaining`
            : "Incorrect code"}
        </p>
      ) : null}

      <style jsx>{`
        .success-flash {
          animation: successFlash 420ms ease-out;
        }

        .error-shake {
          animation: shakeX 340ms ease-in-out;
        }

        @keyframes successFlash {
          0% {
            box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5);
          }
          100% {
            box-shadow: 0 0 0 12px rgba(74, 222, 128, 0);
          }
        }

        @keyframes shakeX {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  )
}
