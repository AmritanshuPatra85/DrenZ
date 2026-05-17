import { NextResponse } from "next/server";
import { authSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const { phone } = parsed.data;
    const supabase = createClient();

    // Rate limit check via Supabase
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("otp_store")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", oneHourAgo);

    if (count && count >= 3) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in 1 hour." },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Upsert OTP into Supabase
    await supabase
      .from("otp_store")
      .upsert({ phone, otp, expires_at: expiresAt, created_at: new Date().toISOString() });

    // Send via Wati if configured
    if (process.env.WATI_API_URL && process.env.WATI_API_TOKEN) {
      try {
        const { wati } = await import("@/lib/wati");
        await wati.sendOtp(phone, otp);
      } catch (watiError) {
        console.error("Wati send failed:", watiError);
      }
    } else {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    return NextResponse.json({ success: true, message: "OTP sent" });
  } catch (error) {
    console.error("verify-whatsapp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}