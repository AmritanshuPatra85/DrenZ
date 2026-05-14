"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

type CountdownTimerProps = {
  expiresAt: string
  className?: string
}

const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const THIRTY_MINUTES_MS = 30 * 60 * 1000

const formatRemaining = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  }
}

export default function CountdownTimer({ expiresAt, className }: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now())

  const expiryMs = useMemo(() => {
    const parsed = Date.parse(expiresAt)
    return Number.isNaN(parsed) ? Date.now() : parsed
  }, [expiresAt])

  useEffect(() => {
    if (now >= expiryMs) {
      return
    }

    const interval = setInterval(() => {
      const current = Date.now()
      if (current >= expiryMs) {
        setNow(expiryMs)
        clearInterval(interval)
        return
      }
      setNow(current)
    }, 1000)

    return () => clearInterval(interval)
  }, [expiryMs, now])

  const remainingMs = Math.max(0, expiryMs - now)
  const isExpired = remainingMs <= 0
  const { hours, minutes, seconds } = formatRemaining(remainingMs)

  const timerToneClass = useMemo(() => {
    if (remainingMs > SIX_HOURS_MS) {
      return "text-green-400"
    }
    if (remainingMs > TWO_HOURS_MS) {
      return "text-amber-400"
    }
    return "text-red-400"
  }, [remainingMs])

  const shouldPulse = !isExpired && remainingMs <= THIRTY_MINUTES_MS

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-brand-card p-4 text-white", className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
        Expires in
      </p>
      {isExpired ? (
        <p className="mt-1 font-mono text-2xl font-black text-red-400 sm:text-3xl">Expired</p>
      ) : (
        <p
          className={cn(
            "mt-1 font-mono text-3xl font-black tracking-wide sm:text-4xl",
            timerToneClass,
            shouldPulse && "animate-pulse"
          )}
        >
          {hours}:{minutes}:{seconds}
        </p>
      )}
    </div>
  )
}
