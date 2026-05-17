import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { otpStore } from "@/app/api/auth/verify-whatsapp/route";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    const isDev = process.env.NODE_ENV === "development";

    if (!isDev) {
      const entry = otpStore.get(phone);

      if (!entry) {
        return NextResponse.json(
          { error: "No OTP found for this number. Request a new one." },
          { status: 400 }
        );
      }

      if (Date.now() > entry.expiresAt) {
        otpStore.delete(phone);
        return NextResponse.json(
          { error: "OTP has expired. Request a new one." },
          { status: 400 }
        );
      }

      if (entry.otp !== otp) {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      }

      otpStore.delete(phone);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { error } = await supabase
      .from("users")
      .update({ phone })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user_id: user.id });
  } catch (error) {
    console.error("confirm-otp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}