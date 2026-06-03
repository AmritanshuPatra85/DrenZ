"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [open,   setOpen]   = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchNotifications = async () => {
    const res  = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setUnread(data.notifications?.filter((n: any) => !n.is_read).length ?? 0);
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      supabase
        .channel(`notifications:${user.id}`)
        .on("postgres_changes", {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${user.id}`,
        }, () => {
          fetchNotifications();
        })
        .subscribe();
    };

    setupRealtime();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "listing_liked":     return "❤️";
      case "new_message":       return "💬";
      case "item_sold":         return "🎉";
      case "payment_received":  return "💰";
      case "offer_received":    return "🤝";
      case "offer_accepted":    return "✅";
      case "meetup_reminder":   return "📍";
      default:                  return "🔔";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative text-white/50 text-xl"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full px-1 min-w-[16px] text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-8 w-80 bg-brand-card border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <p className="text-white font-bold text-sm">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-brand-yellow text-xs">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-white/30 text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-white/5 flex items-start gap-3 ${
                      !n.is_read ? "bg-brand-yellow/5" : ""
                    }`}
                  >
                    <span className="text-xl shrink-0">{getIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold">{n.title}</p>
                      <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{n.body}</p>
                      <p className="text-white/30 text-[10px] mt-1">
                        {new Date(n.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-brand-yellow shrink-0 mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}