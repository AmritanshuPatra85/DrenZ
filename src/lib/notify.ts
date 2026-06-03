import { createClient } from "@/lib/supabase/server";

type NotificationType =
  | "listing_liked"
  | "new_message"
  | "item_sold"
  | "payment_received"
  | "offer_received"
  | "offer_accepted"
  | "meetup_reminder";

type NotifyParams = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function notify({ userId, type, title, body, data = {} }: NotifyParams) {
  const supabase = createClient();

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    data,
  });
}