import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function sendWhatsApp(phone: string, template: string, params: string[]) {
  const res = await fetch(`${process.env.WATI_API_URL}/api/v1/sendTemplateMessage`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.WATI_API_TOKEN}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      whatsappNumber:   phone,
      templateName:     template,
      broadcastName:    template,
      parameters:       params.map(p => ({ name: "value", value: p })),
    }),
  });
  return res.ok;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // Get likes from last hour grouped by listing
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: recentLikes } = await supabase
    .from("likes")
    .select("listing_id, listing:listings(title, seller_id, seller:users(phone, alias))")
    .gte("created_at", since);

  if (!recentLikes || recentLikes.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by listing
  const grouped: Record<string, { title: string; phone: string; alias: string; count: number }> = {};

  for (const like of recentLikes) {
    const listing = like.listing as any;
    if (!listing?.seller?.phone) continue;

    const key = like.listing_id;
    if (!grouped[key]) {
      grouped[key] = {
        title: listing.title,
        phone: listing.seller.phone,
        alias: listing.seller.alias,
        count: 0,
      };
    }
    grouped[key].count++;
  }

  let sent = 0;

  for (const [, info] of Object.entries(grouped)) {
    try {
      const ok = await sendWhatsApp(
        info.phone,
        "listing_activity_summary",
        [info.alias, info.title, String(info.count)]
      );
      if (ok) sent++;
    } catch (err) {
      console.error("WhatsApp batch send failed:", err);
    }
  }

  return NextResponse.json({ sent });
}