import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const createMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { conversationId, content } = parsed.data;

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id, buyer_id, seller_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const isParticipant =
    conversation.buyer_id === user.id || conversation.seller_id === user.id;

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: insertedMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      is_read: false,
    })
    .select("id, sender_id, content, created_at, is_read")
    .single();

  if (insertError || !insertedMessage) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: insertedMessage.created_at ?? new Date().toISOString() })
    .eq("id", conversationId);

  const { data: profile } = await supabase
    .from("users")
    .select("alias")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json(
    {
      message: {
        ...insertedMessage,
        sender_alias: profile?.alias ?? null,
      },
    },
    { status: 201 }
  );
}
