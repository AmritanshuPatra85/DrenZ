import { NextResponse } from "next/server";
import { authSchema } from "@/lib/validations";

// In-memory rate limit store (resets on server restart — fine for MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(phone);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(phone, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }

  if (entry.count >= 3) return true;

  entry.count++;
  return false;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Temporary OTP store (use Redis in production)
export const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const { phone } = parsed.data;

    if (isRateLimited(phone)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in 1 hour." },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Send via Wati if configured, otherwise log for testing
    if (process.env.WATI_API_URL && process.env.WATI_API_TOKEN) {
      const { wati } = await import("@/lib/wati");
      await wati.sendOtp(phone, otp);
    } else {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("verify-whatsapp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
