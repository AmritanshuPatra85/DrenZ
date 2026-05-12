import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: implement batch WhatsApp notifications in Sprint 3
  console.log("Cron job triggered:", new Date().toISOString());

  return NextResponse.json({ success: true, message: "Cron stub OK" });
}